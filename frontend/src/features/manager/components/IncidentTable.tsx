// frontend/src/features/manager/components/IncidentTable.tsx
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, AlertCircle, UserX } from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { PriorityBadge } from './PriorityBadge';

export type IncidentSortField = 'code' | 'createdAt' | 'category' | 'customerName' | 'status' | 'isUrgent';

interface IncidentTableProps {
  tickets: ManagementSupportTicket[];
  sortField: IncidentSortField;
  sortDirection: 'asc' | 'desc';
  onSort: (field: IncidentSortField) => void;
  onViewDetail: (ticketId: number) => void;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  tickets,
  sortField,
  sortDirection,
  onSort,
  onViewDetail,
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

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 text-sm">Không có sự cố nào</h3>
        <p className="text-xs text-slate-500 mt-1">
          Không tìm thấy ticket sự cố phù hợp với điều kiện lọc hiện tại.
        </p>
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
                Ngày báo {renderSortIcon('createdAt')}
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
              <th
                onClick={() => onSort('isUrgent')}
                className="py-3.5 px-4 cursor-pointer hover:text-slate-900 transition-colors"
              >
                Mức ưu tiên {renderSortIcon('isUrgent')}
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
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Mã sự cố */}
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 group-hover:text-brand-600">
                  {t.code}
                </td>

                {/* Ngày báo */}
                <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                  {formatDate(t.createdAt)}
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

                {/* Mức ưu tiên */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge isUrgent={t.isUrgent} />
                </td>

                {/* Nhân viên phụ trách */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {t.assignedStaffName ? (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {t.assignedStaffName.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800 line-clamp-1">
                        {t.assignedStaffName}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200/60">
                      <UserX className="w-3 h-3 text-amber-500" />
                      Chưa gán
                    </span>
                  )}
                </td>

                {/* Trạng thái */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={t.status} />
                </td>

                {/* Thao tác */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(t.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
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
