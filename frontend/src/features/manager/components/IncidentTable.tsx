// frontend/src/features/manager/components/IncidentTable.tsx
import React from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  ArrowRight,
  Clock,
  Layers,
} from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { formatRelativeTime } from '../utils/incidentTimeFilter';

export type IncidentSortField = 'code' | 'createdAt' | 'category' | 'customerName' | 'status';

interface IncidentTableProps {
  tickets: (ManagementSupportTicket & { isBacklog?: boolean })[];
  sortField: IncidentSortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: IncidentSortField) => void;
  onViewDetail: (ticketId: number) => void;
  onQuickAssign?: (ticket: ManagementSupportTicket) => void;
  onResetFilters?: () => void;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  tickets,
  sortField,
  sortDirection,
  onSort,
  onViewDetail,
  onQuickAssign,
  onResetFilters,
}) => {
  const renderSortIcon = (field: IncidentSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand-600 ml-1 inline" />
    );
  };

  const formatExactDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">Không tìm thấy sự cố nào</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Không có sự cố nào khớp với điều kiện lọc và mốc thời gian đang chọn.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-600 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <th
                onClick={() => onSort('code')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Mã sự cố {renderSortIcon('code')}
              </th>
              <th
                onClick={() => onSort('createdAt')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Thời gian báo {renderSortIcon('createdAt')}
              </th>
              <th
                onClick={() => onSort('category')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Loại sự cố {renderSortIcon('category')}
              </th>
              <th className="py-3.5 px-4">Ô kho / HĐ</th>
              <th
                onClick={() => onSort('customerName')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Khách thuê {renderSortIcon('customerName')}
              </th>
              <th className="py-3.5 px-4">Nhân viên phụ trách</th>
              <th
                onClick={() => onSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Trạng thái {renderSortIcon('status')}
              </th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-normal">
            {tickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => onViewDetail(t.id)}
                className={`hover:bg-slate-50/90 transition-colors cursor-pointer group ${
                  t.isBacklog ? 'bg-amber-50/20' : ''
                }`}
              >
                {/* Mã sự cố */}
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-brand-600">
                  <div className="flex items-center gap-1.5">
                    <span>{t.code}</span>
                    {t.isBacklog && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
                        title="Sự cố tồn đọng từ các ngày trước chưa xử lý xong"
                      >
                        Tồn đọng
                      </span>
                    )}
                  </div>
                </td>

                {/* Thời gian báo (Relative time + Tooltip ngày giờ chính xác) */}
                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap" title={formatExactDate(t.createdAt)}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatRelativeTime(t.createdAt)}</span>
                  </div>
                </td>

                {/* Loại sự cố */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <TypeBadge category={t.category} />
                </td>

                {/* Ô kho / Hợp đồng */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {t.storageUnitCode}
                  </span>
                  {t.relocationRequired && (
                    <span className="block text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-1 rounded mt-0.5 w-fit">
                      ⚠️ Cần đổi kho
                    </span>
                  )}
                  {t.contractCode && (
                    <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                      {t.contractCode}
                    </span>
                  )}
                </td>

                {/* Khách thuê */}
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-slate-900 block line-clamp-1">
                    {t.customerName}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {t.customerPhone || 'Chưa có SĐT'}
                  </span>
                </td>

                {/* Nhân viên phụ trách / Nút Gán nhanh */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {t.assignedStaffName ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {t.assignedStaffName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800 line-clamp-1">
                        {t.assignedStaffName}
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAssign?.(t);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full font-semibold border border-amber-200/80 transition-colors shadow-2xs cursor-pointer group/btn"
                      title="Bấm để phân công nhanh nhân viên trực ca"
                    >
                      <UserPlus className="w-3 h-3 text-amber-600 group-hover/btn:scale-110 transition-transform" />
                      <span>Chưa gán · Gán nhanh</span>
                    </button>
                  )}
                </td>

                {/* Trạng thái */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={t.status} />
                </td>

                {/* Thao tác */}
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(t.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:text-white hover:bg-brand-600 border border-brand-200 hover:border-brand-600 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <span>Chi tiết</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
