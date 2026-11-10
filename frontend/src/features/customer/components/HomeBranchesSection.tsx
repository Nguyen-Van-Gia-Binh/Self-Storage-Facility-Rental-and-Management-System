import React from 'react';
import { Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { DisplayFacility } from '../hooks/useFacilityDirectory';
import { HomeFacilityCard } from './HomeFacilityCard';

interface HomeBranchesSectionProps {
  isLoading: boolean;
  availableCities: string[];
  cityFacilityCounts: Record<string, number>;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  selectedStorageType: string;
  selectedSize: string;
  onResetFilters: () => void;
  paginatedFacilities: DisplayFacility[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const STORAGE_TYPE_LABELS: Record<string, string> = {
  standard: 'Kho Tiêu Chuẩn',
  climate: 'Kho Máy Lạnh',
};

const SIZE_LABELS: Record<string, string> = {
  S: 'Cỡ nhỏ (1–3m²)',
  M: 'Cỡ vừa (6m²)',
  L: 'Cỡ lớn (10–15m²)',
};

/**
 * Mạng lưới cơ sở thực tế lấy từ Backend API, hỗ trợ lọc theo tỉnh thành và mang theo
 * bộ lọc loại kho / kích thước khi người dùng bấm vào từng chi nhánh.
 */
export const HomeBranchesSection: React.FC<HomeBranchesSectionProps> = ({
  isLoading,
  availableCities,
  cityFacilityCounts,
  selectedCity,
  onSelectCity,
  selectedStorageType,
  selectedSize,
  onResetFilters,
  paginatedFacilities,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const hasSecondaryFilter = selectedStorageType !== 'all' || selectedSize !== 'all';

  return (
    <section className="py-14 sm:py-16 bg-white border-b border-slate-200" id="branches">
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-[#439782] text-xs font-bold uppercase tracking-wider block mb-1.5">
            Hệ Thống Chi Nhánh Đang Hoạt Động
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0a1614] tracking-tight">
            Chọn cơ sở gần bạn nhất để xem ô trống
          </h2>
          <p className="text-sm text-slate-600 mt-1.5">
            Dữ liệu chi nhánh, giá thuê và số lượng ô trống được cập nhật trực tiếp từ hệ thống.
          </p>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {availableCities.map((city) => {
            const count = cityFacilityCounts[city];
            const active = selectedCity === city;
            return (
              <button
                key={city}
                type="button"
                onClick={() => onSelectCity(city)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#57b29a] text-white shadow-xs'
                    : 'bg-[#f2f9f7] text-slate-700 border border-slate-200 hover:border-[#57b29a]/50'
                }`}
              >
                {city} {count !== undefined ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Thông báo bộ lọc loại kho / kích thước đang chọn */}
        {hasSecondaryFilter && (
          <div className="max-w-2xl mx-auto mb-8 px-4 py-2.5 rounded-xl bg-[#f2f9f7] border border-[#57b29a]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-700">
              Bộ lọc áp dụng khi xem chi nhánh:{' '}
              <strong className="text-[#0a1614]">
                {[
                  selectedStorageType !== 'all' ? STORAGE_TYPE_LABELS[selectedStorageType] : null,
                  selectedSize !== 'all' ? SIZE_LABELS[selectedSize] : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </strong>
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-[#439782] hover:text-[#0a1614] font-semibold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          </div>
        )}

        {/* Danh sách cơ sở */}
        {isLoading ? (
          <div className="p-14 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#57b29a] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Đang tải danh sách cơ sở từ hệ thống...
            </p>
          </div>
        ) : paginatedFacilities.length === 0 ? (
          <div className="p-12 text-center bg-[#f2f9f7] rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-700">
              Không tìm thấy cơ sở nào phù hợp khu vực đã chọn.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-3 px-4 py-2 bg-[#57b29a] hover:bg-[#439782] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Xem tất cả cơ sở
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedFacilities.map((fac) => (
              <HomeFacilityCard
                key={fac.id}
                facility={fac}
                preselectedStorageType={selectedStorageType}
                preselectedSize={selectedSize}
              />
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
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#57b29a] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

