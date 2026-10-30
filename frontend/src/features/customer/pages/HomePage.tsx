import React, { useState, useMemo } from 'react';
import { Loader2, MapPin, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFacilityDirectory } from '../hooks/useFacilityDirectory';
import { HomeFacilityCard } from '../components/HomeFacilityCard';
import { HomeSearchBar } from '../components/HomeSearchBar';

export const HomePage: React.FC = () => {
  const { facilities, isLoading } = useFacilityDirectory();
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả thành phố');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

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

  // Reset về trang 1 khi lọc thành phố hoặc tìm kiếm thay đổi
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCity, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredFacilities.length);
  const paginatedFacilities = useMemo(() => {
    return filteredFacilities.slice(startIndex, startIndex + pageSize);
  }, [filteredFacilities, startIndex, pageSize]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* HERO BANNER: INTENTIONAL MINIMALISM */}
      <div className="text-center max-w-4xl mx-auto pt-2 pb-1 space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50/80 border border-brand-200/90 text-brand-700 text-xs font-semibold shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
          <span>Không gian gửi đồ an toàn & riêng tư</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Chọn cơ sở gửi đồ <span className="text-brand-600">gần bạn nhất</span>
        </h1>
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
          <div className="space-y-8">
            {/* Cards Grid: Centered Flex Layout for balanced aesthetics (6 per page) */}
            <div className="flex flex-wrap justify-center gap-6">
              {paginatedFacilities.map((fac) => (
                <HomeFacilityCard key={fac.id} facility={fac} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200/80 text-xs text-slate-500">
                <div className="font-medium">
                  Hiển thị <span className="font-bold text-slate-800">{startIndex + 1}</span> -{' '}
                  <span className="font-bold text-slate-800">{endIndex}</span> trên tổng số{' '}
                  <span className="font-bold text-slate-800">{filteredFacilities.length}</span> cơ sở
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer shadow-2xs"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 380, behavior: 'smooth' });
                      }}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer shadow-2xs"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
