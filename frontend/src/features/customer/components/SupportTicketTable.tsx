import React, { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SupportTicket } from '../types';
import { getCategoryMeta, getStatusMeta } from './SupportTicketCard';

export interface SupportTicketTableProps {
  tickets: SupportTicket[];
  onViewDetail: (ticket: SupportTicket) => void;
  onCancel?: (ticket: SupportTicket) => void;
  pageSize?: number;
}

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
              const statusMeta = getStatusMeta(ticket.status);
              const CategoryIcon = catMeta.icon;

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

                  {/* 2. Phân loại */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${catMeta.color}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>{catMeta.label}</span>
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

                  {/* 5. Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      {ticket.status === 'IN_PROGRESS' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </div>
                  </td>

                  {/* 6. Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticket.status === 'NEW' && onCancel && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancel(ticket);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                          title="Hủy yêu cầu"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Hủy yêu cầu</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onViewDetail(ticket)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50/60 transition-all cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
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
