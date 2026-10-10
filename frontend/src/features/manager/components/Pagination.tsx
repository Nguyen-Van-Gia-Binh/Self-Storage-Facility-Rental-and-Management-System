import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number; // 1-based index (1, 2, 3...)
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  threshold?: number; // Ngưỡng bật phân trang. Nếu totalItems <= threshold, component trả về null (trừ khi showAlways=true)
  itemName?: string; // Tên danh từ: "cơ sở", "loại ô kho", "ô kho", "hợp đồng"
  pageSizeOptions?: number[]; // Các tùy chọn kích thước trang (ví dụ [6, 12, 24] hoặc [10, 25, 50])
  onPageSizeChange?: (size: number) => void;
  showAlways?: boolean; // Bật thanh phân trang luôn luôn ngay cả khi chỉ có 1 trang
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  threshold = 10,
  itemName = 'mục',
  pageSizeOptions,
  onPageSizeChange,
  showAlways = false,
}) => {
  // Nếu không yêu cầu showAlways và số items quá ít, ẩn đi
  if (!showAlways && (totalItems <= threshold || totalPages <= 1)) {
    return null;
  }

  // Nếu không có item nào thì không hiển thị
  if (totalItems === 0) {
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

      {/* Hiển thị số lượng & Bộ chọn kích thước trang */}
      <div className="flex items-center gap-4 text-slate-500 font-medium">
        {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          Hiển thị <span className="font-bold text-slate-800">{currentDisplayed}</span> /{' '}
          <span className="font-bold text-slate-800">{totalItems}</span> {itemName}
        </div>
      </div>
    </div>
  );
};
