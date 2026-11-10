import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, MapPin, Check, Thermometer, Box } from 'lucide-react';

export interface HomeSearchBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  availableCities: string[];
  cityFacilityCounts: Record<string, number>;
  totalFacilitiesCount: number;
  selectedStorageType: string;
  onSelectStorageType: (type: string) => void;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onSearchSubmit: () => void;
}

const STORAGE_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'standard', label: 'Tiêu chuẩn' },
  { value: 'climate', label: 'Máy lạnh' },
];

const SIZE_OPTIONS = [
  { value: 'all', label: 'Mọi size' },
  { value: 'S', label: 'Nhỏ (1–3m²)' },
  { value: 'M', label: 'Vừa (6m²)' },
  { value: 'L', label: 'Lớn (10–15m²)' },
];

/**
 * Thanh tìm kiếm nhanh tại Hero: chọn Khu vực (Custom Dropdown chuẩn ARIA),
 * Loại kho và Kích thước mong muốn để chuyển ngay sang chọn ô kho phù hợp.
 */
export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
  selectedCity,
  onSelectCity,
  availableCities,
  cityFacilityCounts,
  totalFacilitiesCount,
  selectedStorageType,
  onSelectStorageType,
  selectedSize,
  onSelectSize,
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
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-xl border border-slate-200/90"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        {/* 1. Khu vực / Thành phố — Custom Dropdown */}
        <div ref={cityDropdownRef} className="relative lg:col-span-3">
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
            <span className="text-xs font-bold text-[#0a1614] truncate">
              {selectedCity}
            </span>
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
                      <span className="text-[11px] font-normal text-slate-400">
                        ({count})
                      </span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#57b29a] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Loại kho — Segmented Pills */}
        <div className="lg:col-span-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1.5">
            <Thermometer className="w-3.5 h-3.5 text-[#57b29a]" />
            Loại kho
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#f2f9f7]/80 border border-slate-200 rounded-xl">
            {STORAGE_TYPE_OPTIONS.map((opt) => {
              const active = selectedStorageType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectStorageType(opt.value)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate ${
                    active
                      ? 'bg-white text-[#0a1614] shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Nhu cầu kích thước — Segmented Pills */}
        <div className="lg:col-span-4">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1.5">
            <Box className="w-3.5 h-3.5 text-[#57b29a]" />
            Kích thước dự kiến
          </span>
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#f2f9f7]/80 border border-slate-200 rounded-xl">
            {SIZE_OPTIONS.map((opt) => {
              const active = selectedSize === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectSize(opt.value)}
                  className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate ${
                    active
                      ? 'bg-white text-[#0a1614] shadow-xs border border-slate-200/80'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. CTA Search */}
        <div className="lg:col-span-2">
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#57b29a] hover:bg-[#439782] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tìm kho trống</span>
          </button>
        </div>
      </div>
    </form>
  );
};
