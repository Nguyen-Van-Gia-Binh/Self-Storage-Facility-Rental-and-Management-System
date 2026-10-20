import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, MapPin, Check, X } from 'lucide-react';

interface HomeSearchBarProps {
  selectedCity: string;
  onSelectCity: (city: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  availableCities: string[];
  cityFacilityCounts: Record<string, number>;
  totalFacilitiesCount: number;
}

/**
 * Thanh tìm kiếm & bộ lọc khu vực cho HomePage
 * Tích hợp Dropdown chọn Tỉnh/Thành phố và ô tìm kiếm theo tên, địa chỉ, quận huyện.
 */
export const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
  selectedCity,
  onSelectCity,
  searchQuery,
  onSearchChange,
  availableCities,
  cityFacilityCounts,
  totalFacilitiesCount,
}) => {
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click bên ngoài
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
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl p-2 shadow-xs hover:shadow-sm border border-brand-200/80 flex flex-col sm:flex-row items-stretch sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100 transition-all focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/10">
        
        {/* City Filter Segment - Custom Dropdown with Real DB Data */}
        <div ref={cityDropdownRef} className="relative sm:w-64 shrink-0">
          <button
            type="button"
            id="city-dropdown-trigger"
            onClick={() => setIsCityDropdownOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isCityDropdownOpen}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl transition-all cursor-pointer text-left group ${
              isCityDropdownOpen
                ? 'bg-slate-100/90 ring-2 ring-brand-500/20'
                : 'hover:bg-slate-50/80'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none mb-1">
                Khu vực
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0a1614] block truncate">
                {selectedCity}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                isCityDropdownOpen ? 'rotate-180 text-brand-600' : 'group-hover:text-slate-600'
              }`}
            />
          </button>

          {/* Custom Dropdown Floating Menu Panel */}
          {isCityDropdownOpen && (
            <div
              role="listbox"
              className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/70 border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-3 py-1.5 mb-1 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Khu vực</span>
                <span className="font-mono text-slate-500 font-semibold">
                  {totalFacilitiesCount} cơ sở
                </span>
              </div>
              <div className="space-y-0.5 max-h-60 overflow-y-auto">
                {availableCities.map((c) => {
                  const isSelected = selectedCity === c;
                  const count = cityFacilityCounts[c] ?? 0;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelectCity(c);
                        setIsCityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-brand-50 text-brand-700 font-bold shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">{c}</span>
                      </span>
                      <span
                        className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                          isSelected
                            ? 'bg-brand-100/70 text-brand-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Text Search Segment */}
        <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Tìm theo tên cơ sở, đường phố, quận huyện..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium text-[#0a1614] placeholder:text-slate-400 focus:outline-none bg-transparent py-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
