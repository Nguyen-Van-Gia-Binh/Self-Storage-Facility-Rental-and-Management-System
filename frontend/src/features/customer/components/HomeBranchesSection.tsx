import React from 'react';
import { Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';
import { HomeFacilityCard } from './HomeFacilityCard';
import { HomeSearchBar, type HomeSearchBarProps } from './HomeSearchBar';

interface HomeBranchesSectionProps extends HomeSearchBarProps {
  isLoading: boolean;
  onResetFilters: () => void;
  paginatedFacilities: DisplayFacility[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Mạng lưới cơ sở thực tế lấy từ Backend API kèm thanh tìm kiếm khu vực gọn gàng.
 */
export const HomeBranchesSection: React.FC<HomeBranchesSectionProps> = ({
  isLoading,
  onResetFilters,
  paginatedFacilities,
  currentPage,
  totalPages,
  onPageChange,
  ...searchBarProps
}) => {
  const { selectedCity } = searchBarProps;
  const hasActiveFilter = selectedCity !== 'Tất cả thành phố';

  return (
    <section
      className="py-14 sm:py-16 bg-white border-b border-slate-200 scroll-mt-16"
      id="branches"
    >
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-7">
          <span className="font-pixel text-[#0c5a8a] text-[13px] font-medium uppercase tracking-wider block mb-1.5">
            Hệ Thống Chi Nhánh
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#0a1614] tracking-tight">
            Chọn cơ sở gần bạn nhất
          </h2>
        </div>

        {/* Ô tìm kiếm khu vực gọn nhẹ ngay dưới tiêu đề Hệ thống chi nhánh */}
        <div className="max-w-2xl mx-auto mb-10 space-y-2">
          <HomeSearchBar {...searchBarProps} />

          {hasActiveFilter && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0c5a8a] hover:underline cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Xem tất cả khu vực</span>
              </button>
            </div>
          )}
        </div>

        {/* Danh sách cơ sở */}
        {isLoading ? (
          <div className="p-14 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#0c5a8a] animate-spin" />
            <p className="text-sm font-semibold text-slate-700">
              Đang tải danh sách cơ sở...
            </p>
          </div>
        ) : paginatedFacilities.length === 0 ? (
          <div className="p-12 text-center bg-[#f3f8fc] rounded-2xl border border-sky-200/80">
            <p className="text-base font-semibold text-slate-700">
              Không tìm thấy cơ sở nào phù hợp.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-5 py-2.5 bg-[#0c5a8a] hover:bg-[#084369] text-white text-sm font-bold rounded-xl cursor-pointer transition-colors"
            >
              Xem tất cả cơ sở
            </button>
          </div>
        ) : (
          <div id="branches-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedFacilities.map((fac) => (
              <HomeFacilityCard key={fac.id} facility={fac} />
            ))}
          </div>
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#0c5a8a] text-white shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
