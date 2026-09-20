// frontend/src/features/manager/components/UnitTypeCard.tsx
import React from 'react';
import { UnitTypeResponse } from '@/types/unit';

interface UnitTypeCardProps {
  type: UnitTypeResponse;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onToggle: () => void;
}

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' d/thang';

export const UnitTypeCard: React.FC<UnitTypeCardProps> = ({
  type,
  isSelected,
  onClick,
  onEdit,
  onToggle,
}) => (
  <div
    onClick={onClick}
    className={`cursor-pointer rounded-lg border transition-colors duration-150 p-4 ${
      isSelected
        ? 'border-[#4F7FFA] bg-[#1A2A4A]'
        : 'border-[#2E3652] bg-[#1A1F2E] hover:border-[#4F7FFA]/50 hover:bg-[#1E2440]'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#E8EAF0] truncate">{type.name}</span>
          {!type.isActive && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700 shrink-0">
              Vo hieu
            </span>
          )}
        </div>
        <p className="text-xs text-[#8890A4] mt-0.5 truncate">{type.description}</p>
      </div>
    </div>

    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
      <div>
        <span className="text-[#8890A4]">Dien tich</span>
        <p className="font-mono text-[#E8EAF0] mt-0.5">{type.areaM2} m&sup2;</p>
      </div>
      <div>
        <span className="text-[#8890A4]">Tong o</span>
        <p className="font-mono text-[#E8EAF0] mt-0.5">{type.totalUnits} o</p>
      </div>
      <div className="col-span-2">
        <span className="text-[#8890A4]">Don gia</span>
        <p className="font-mono text-[#4F7FFA] mt-0.5">{fmt(type.monthlyPrice)}</p>
      </div>
    </div>

    <div className="mt-3 flex items-center gap-2 border-t border-[#2E3652] pt-3">
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="text-xs text-[#8890A4] hover:text-[#E8EAF0] transition-colors px-2 py-1 rounded hover:bg-[#2E3652]"
      >
        Sua
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          type.isActive
            ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
            : 'text-green-400 hover:text-green-300 hover:bg-green-900/30'
        }`}
      >
        {type.isActive ? 'Vo hieu hoa' : 'Kich hoat'}
      </button>
    </div>
  </div>
);
