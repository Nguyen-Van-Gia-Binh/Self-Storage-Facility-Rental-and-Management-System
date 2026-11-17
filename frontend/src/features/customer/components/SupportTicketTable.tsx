import React, { useState, useEffect, useMemo } from 'react';
import { XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SupportTicket, SupportStatus } from '../types';
import { getCategoryMeta } from './SupportTicketCard';

export interface SupportTicketTableProps {
  tickets: SupportTicket[];
  onViewDetail: (ticket: SupportTicket) => void;
  onCancel?: (ticket: SupportTicket) => void;
  pageSize?: number;
}

/**
 * Hiển thị Badge trạng thái chuẩn Semantic Colors (Anti AI Slop)
 * - Đang xử lý: Vàng/Cam (Warning)
 * - Đã phân công: Xanh dương (Info)
 * - Mới gửi: Xanh lá (Active)
 * - Đã đóng: Xám trung tính (Neutral)
 */
const renderStatusBadge = (status: SupportStatus) => {
  switch (status) {
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Đang xử lý</span>
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Đã phân công</span>
        </span>
      );
    case 'NEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Mới gửi</span>
        </span>
      );
    case 'RESOLVED':
    case 'CLOSED':
    case 'AUTO_CLOSED':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Đã đóng</span>
        </span>
      );
  }
};

export const SupportTicketTable: React.FC<SupportTicketTableProps> = ({
  tickets,
  onViewDetail,
  onCancel,
  pageSize = 7,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(tickets.length / pageSize));

  // Reset về trang 1 khi danh sách vé thay đổi (do lọc hoặc tìm kiếm)
  useEffect(() => {
    setCurrentPage(1);
  }, [tickets.length]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, tickets.length);
  const paginatedTickets = useMemo(() => {
    return tickets.slice(startIndex, startIndex + pageSize);
  }, [tickets, startIndex, pageSize]);

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/85 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3 px-4">Mã vé</th>
              <th className="py-3 px-4">Vấn đề hỗ trợ</th>
              <th className="py-3 px-4">Ô kho / Cơ sở</th>
              <th className="py-3 px-4">Nội dung yêu cầu</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedTickets.map((ticket) => {
              const catMeta = getCategoryMeta(ticket.category);

              const formattedDate = new Date(ticket.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });

              const isClosedOrResolved =
                ticket.status === 'RESOLVED' ||
                ticket.status === 'CLOSED' ||
                ticket.status === 'AUTO_CLOSED';

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onViewDetail(ticket)}
                  className={`transition-colors cursor-pointer group ${
                    isClosedOrResolved
                      ? 'hover:bg-slate-50/50 opacity-80'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* 1. Mã vé & Ngày gửi */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-extrabold text-sm text-slate-900 tracking-tight block">
                      {ticket.ticketCode}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                      {formattedDate}
                    </span>
                  </td>

                  {/* 2. Vấn đề hỗ trợ (Text thuần, triệt tiêu viền cầu vồng) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-xs font-semibold text-slate-900">
                      {catMeta.label}
                    </span>
                  </td>

                  {/* 3. Ô kho & Cơ sở */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {ticket.unitNumber ? (
                      <span className="font-bold text-slate-900 text-xs block">
                        Kho {ticket.unitNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-xs block">--</span>
                    )}
                    <span
                      className="text-[11px] text-slate-500 font-medium truncate max-w-[170px] block mt-0.5"
                      title={ticket.facilityName}
                    >
                      {ticket.facilityName || 'Hệ thống chung'}
                    </span>
                  </td>

                  {/* 4. Nội dung sự cố */}
                  <td className="py-3.5 px-4">
                    <p
                      className="text-xs text-slate-700 font-medium line-clamp-1 max-w-xs sm:max-w-sm lg:max-w-md"
                      title={ticket.title || ticket.description}
                    >
                      {ticket.title || ticket.description}
                    </p>
                  </td>

                  {/* 5. Trạng thái (Semantic Colors có chấm tròn tương phản cao) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {renderStatusBadge(ticket.status)}
                  </td>

                  {/* 6. Thao tác (Icon mũi tên tinh gọn) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticket.status === 'NEW' && onCancel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(ticket);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hủy yêu cầu"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hủy</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewDetail(ticket)}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer group-hover:text-brand-600"
                        title="Xem chi tiết"
                        aria-label="Xem chi tiết"
                      >
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {tickets.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60 text-xs text-slate-500">
          <div className="font-medium">
            Hiển thị <span className="font-bold text-slate-800">{startIndex + 1}</span> -{' '}
            <span className="font-bold text-slate-800">{endIndex}</span> trên tổng số{' '}
            <span className="font-bold text-slate-800">{tickets.length}</span> vé
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
