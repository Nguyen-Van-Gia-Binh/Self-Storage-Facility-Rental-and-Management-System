import React, { useState, useMemo } from 'react';
import { Loader2, Sparkles, MapPin } from 'lucide-react';
import { useFacilityDirectory } from '../hooks/useFacilityDirectory';
import { HomeFacilityCard } from '../components/HomeFacilityCard';
import { HomeSearchBar } from '../components/HomeSearchBar';

export const HomePage: React.FC = () => {
  const { facilities, isLoading } = useFacilityDirectory();
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Trích xuất danh sách Thành phố từ dữ liệu cơ sở thật
  const availableCities = useMemo(() => {
    const set = new Set(facilities.map((f) => f.city));
    return ['Tất cả thành phố', ...Array.from(set)];
  }, [facilities]);

  // Đếm số lượng cơ sở thật theo từng tỉnh thành từ CSDL
  const cityFacilityCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Tất cả thành phố': facilities.length,
    };
    facilities.forEach((f) => {
      counts[f.city] = (counts[f.city] || 0) + 1;
    });
    return counts;
  }, [facilities]);

  // Lọc cơ sở theo Thành phố và Search Query
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchCity = selectedCity === 'Tất cả thành phố' || f.city === selectedCity;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.address.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q);
      return matchCity && matchQuery;
    });
  }, [facilities, selectedCity, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* HERO BANNER: INTENTIONAL MINIMALISM */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
            Hệ Thống Kho Tự Quản Thông Minh 24/7
          </span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0a1614] tracking-tight">
          Chọn Cơ Sở Kho Gần Bạn Nhất
        </h1>
        
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
          Hệ thống ô kho tự quản an toàn, kiểm soát ra vào bằng mã PIN điện tử, bảo quản đồ đạc tiêu chuẩn và máy lạnh cao cấp.
        </p>
      </div>

      {/* SEARCH & FILTER BAR COMPONENT */}
      <HomeSearchBar
        selectedCity={selectedCity}
        onSelectCity={setSelectedCity}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        availableCities={availableCities}
        cityFacilityCounts={cityFacilityCounts}
        totalFacilitiesCount={facilities.length}
      />

      {/* FACILITIES DIRECTORY */}
      <div className="space-y-6">
        
        <div className="flex items-center gap-3 border-b border-brand-200/60 pb-3">
          <h2 className="text-xl font-extrabold text-[#0a1614] tracking-tight">
            {selectedCity === 'Tất cả thành phố' ? 'Tất cả cơ sở' : `Cơ sở tại ${selectedCity}`}
          </h2>
          <span className="text-xs font-bold text-brand-700 bg-brand-100/70 border border-brand-200 px-2.5 py-0.5 rounded-full">
            {filteredFacilities.length} cơ sở
          </span>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Đang tải dữ liệu cơ sở thật từ hệ thống...</p>
          </div>
        ) : filteredFacilities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-brand-200 p-8 space-y-3">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy cơ sở phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vui lòng thử chọn thành phố khác hoặc xóa từ khóa tìm kiếm để xem tất cả cơ sở.
            </p>
          </div>
        ) : (
          /* Cards Grid: Centered Flex Layout for balanced aesthetics */
          <div className="flex flex-wrap justify-center gap-6">
            {filteredFacilities.map((fac) => (
              <HomeFacilityCard key={fac.id} facility={fac} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
