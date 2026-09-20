import React from 'react';
import { Search, X } from 'lucide-react';

interface FacilityFilterProps {
  keyword: string;
  onKeywordChange: (v: string) => void;
  districts: string[];
  selectedDistricts: string[];
  onToggleDistrict: (district: string) => void;
  onClear: () => void;
}

export const FacilityFilter: React.FC<FacilityFilterProps> = ({
  keyword,
  onKeywordChange,
  districts,
  selectedDistricts,
  onToggleDistrict,
  onClear,
}) => {
  const hasFilter = keyword !== '' || selectedDistricts.length > 0;
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          id="facility-search-input"
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Tìm theo tên cơ sở hoặc địa chỉ..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
        {keyword && (
          <button
            onClick={() => onKeywordChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Xóa tìm kiếm"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {districts.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-medium">Lọc theo khu vực:</span>
          {districts.map((d) => {
            const active = selectedDistricts.includes(d);
            return (
              <button
                key={d}
                id={`filter-district-${d.replace(/\s+/g, '-')}`}
                onClick={() => onToggleDistrict(d)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                }`}
              >
                {d}
                {active && <X className="w-3 h-3" />}
              </button>
            );
          })}
          {hasFilter && (
            <button
              id="btn-clear-filters"
              onClick={onClear}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors underline"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
};
