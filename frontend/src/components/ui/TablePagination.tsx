import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  /** 0-based current page index */
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  itemLabel?: string;
  pageSizeOptions?: number[];
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextSize: number) => void;
}

function buildPageNumbers(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages: Array<number | 'ellipsis'> = [0];
  const start = Math.max(1, currentPage - 1);
  const end = Math.min(totalPages - 2, currentPage + 1);

  if (start > 1) pages.push('ellipsis');
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  if (end < totalPages - 2) pages.push('ellipsis');
  pages.push(totalPages - 1);
  return pages;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  totalElements,
  totalPages,
  itemLabel = 'mục',
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalElements === 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(0, page), safeTotalPages - 1);
  const startItem = safePage * pageSize + 1;
  const endItem = Math.min((safePage + 1) * pageSize, totalElements);
  const pageNumbers = buildPageNumbers(safePage, safeTotalPages);

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
      {/* Left: Rows per page + Summary Info */}
      <div className="flex flex-wrap items-center gap-3">
        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5 text-gray-600">
            <select
              aria-label="Số dòng mỗi trang"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-md px-2 py-1 pr-6 text-xs font-medium text-gray-800 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer tabular-nums"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>dòng / trang</span>
          </label>
        )}

        <span className="text-gray-500 tabular-nums">
          Hiển thị{' '}
          <strong className="font-semibold text-gray-800">
            {startItem} - {endItem}
          </strong>{' '}
          trong tổng số{' '}
          <strong className="font-semibold text-gray-800">{totalElements}</strong> {itemLabel}
        </span>
      </div>

      {/* Right: Prev + Numbered Pages + Next */}
      <nav aria-label="Phân trang bảng dữ liệu" className="flex items-center gap-1 self-end sm:self-auto">
        <button
          type="button"
          disabled={safePage === 0}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Trước</span>
        </button>

        {pageNumbers.map((item, idx) =>
          item === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400 select-none">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === safePage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={`min-w-[30px] px-2 py-1.5 rounded-md border text-xs tabular-nums transition-colors cursor-pointer ${
                item === safePage
                  ? 'bg-gray-900 text-white border-gray-900 font-semibold'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 font-medium'
              }`}
            >
              {item + 1}
            </button>
          )
        )}

        <button
          type="button"
          disabled={safePage + 1 >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
        >
          <span>Sau</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </nav>
    </div>
  );
};
