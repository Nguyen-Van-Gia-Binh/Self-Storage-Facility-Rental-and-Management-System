import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number; // 1-based index (1, 2, 3...)
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  threshold?: number; // Ngưỡng bật phân trang. Nếu totalItems <= threshold, component trả về null
  itemName?: string; // Tên danh từ: "cơ sở", "loại ô kho", "ô kho"
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  threshold = 10,
  itemName = 'mục',
}) => {
  // Chỉ bật phân trang khi tổng số items vượt quá ngưỡng threshold
  if (totalItems <= threshold || totalPages <= 1) {
    return null;
  }

  // Tính số lượng item đang hiển thị trên trang hiện tại
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  const currentDisplayed = endIndex - startIndex + 1;

  // Tính các số trang cần hiển thị (hỗ trợ ellipsis ...)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 text-xs text-slate-600 select-none">
      {/* Phân trang: < 1 2 3 ... 9 > */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-700"
          title="Trang trước"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400 font-medium">
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[32px] h-8 px-2 rounded-lg font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs font-bold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer text-slate-700"
          title="Trang tiếp theo"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hiển thị số lượng: Hiển thị 12/100 cơ sở */}
      <div className="text-slate-500 font-medium">
        Hiển thị <span className="font-bold text-slate-800">{currentDisplayed}</span> /{' '}
        <span className="font-bold text-slate-800">{totalItems}</span> {itemName}
      </div>
    </div>
  );
};
