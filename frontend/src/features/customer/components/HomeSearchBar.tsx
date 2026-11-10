import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, MapPin, Check } from 'lucide-react';

export interface HomeSearchBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  availableCities: string[];
  cityFacilityCounts: Record<string, number>;
  totalFacilitiesCount: number;
  onSearchSubmit: () => void;
}

/**
 * Thanh tìm kiếm chi nhánh theo Khu vực / Thành phố (Custom Dropdown chuẩn ARIA).
 */
export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
  selectedCity,
  onSelectCity,
  availableCities,
  cityFacilityCounts,
  totalFacilitiesCount,
  onSearchSubmit,
}) => {
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form
      id="filter-bar"
      onSubmit={(e) => {
        e.preventDefault();
        onSearchSubmit();
      }}
      className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-200/90"
    >
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        {/* Khu vực / Thành phố — Custom Dropdown */}
        <div ref={cityDropdownRef} className="relative flex-1 min-w-0">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#57b29a]" />
            Khu vực tìm kho
          </span>
          <button
            type="button"
            id="city-dropdown-trigger"
            onClick={() => setIsCityDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isCityDropdownOpen}
            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              isCityDropdownOpen
                ? 'bg-[#f2f9f7] border-[#57b29a] ring-2 ring-[#57b29a]/20'
                : 'bg-[#f2f9f7]/60 border-slate-200 hover:border-[#57b29a]/50'
            }`}
          >
            <span className="text-xs font-bold text-[#0a1614] truncate">{selectedCity}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isCityDropdownOpen ? 'rotate-180 text-[#57b29a]' : ''
              }`}
            />
          </button>

          {isCityDropdownOpen && (
            <div
              role="listbox"
              aria-label="Chọn khu vực thành phố"
              className="absolute top-full left-0 mt-2 w-full min-w-[230px] bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50"
            >
              {availableCities.map((city) => {
                const isSelected = selectedCity === city;
                const count =
                  city === 'Tất cả thành phố'
                    ? totalFacilitiesCount
                    : cityFacilityCounts[city] ?? 0;
                return (
                  <button
                    key={city}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectCity(city);
                      setIsCityDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#f2f9f7] text-[#439782] font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="truncate">
                      {city}{' '}
                      <span className="text-[11px] font-normal text-slate-400">({count})</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#57b29a] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA Search */}
        <button
          type="submit"
          className="sm:w-auto px-6 py-2.5 rounded-xl bg-[#57b29a] hover:bg-[#439782] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer shrink-0 h-[38px]"
        >
          <Search className="w-4 h-4" />
          <span>Tìm kho trống</span>
        </button>
      </div>
    </form>
  );
};
