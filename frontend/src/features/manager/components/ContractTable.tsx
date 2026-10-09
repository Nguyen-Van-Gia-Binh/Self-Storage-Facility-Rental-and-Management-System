// frontend/src/features/manager/components/ContractTable.tsx
import React from 'react';
import {
  FileText,
  User,
  Box,
  Calendar,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';
import { StatusBadge } from './StatusBadge';

export type ContractSortField = 'code' | 'customer' | 'unit' | 'status' | 'endDate';
export type SortDirection = 'asc' | 'desc';

interface ContractTableProps {
  contracts: ManagerContractItem[];
  onSelectContract: (contract: ManagerContractItem) => void;
  sortField?: ContractSortField;
  sortDirection?: SortDirection;
  onSort?: (field: ContractSortField) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onSelectContract,
  sortField,
  sortDirection = 'asc',
  onSort,
}) => {
  if (contracts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Không có hợp đồng nào phù hợp</h3>
        <p className="text-xs text-slate-500 mt-1">
          Chưa có hợp đồng nào khớp với bộ lọc trạng thái và từ khóa tìm kiếm được chọn.
        </p>
      </div>
    );
  }

  const renderSortIcon = (field: ContractSortField) => {
    if (!onSort) return null;
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-brand-600 shrink-0" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-brand-600 shrink-0" />
      );
    }
    return (
      <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover/col:text-slate-500 shrink-0" />
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
              {/* Cột Mã Hợp đồng */}
              <th
                onClick={() => onSort?.('code')}
                className={`py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group/col ${
                  sortField === 'code' ? 'text-brand-600 bg-brand-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Mã HĐ</span>
                  {renderSortIcon('code')}
                </div>
              </th>

              {/* Cột Khách thuê */}
              <th
                onClick={() => onSort?.('customer')}
                className={`py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group/col ${
                  sortField === 'customer' ? 'text-brand-600 bg-brand-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Khách thuê</span>
                  {renderSortIcon('customer')}
                </div>
              </th>

              {/* Cột Ô kho */}
              <th
                onClick={() => onSort?.('unit')}
                className={`py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group/col ${
                  sortField === 'unit' ? 'text-brand-600 bg-brand-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Ô kho</span>
                  {renderSortIcon('unit')}
                </div>
              </th>

              {/* Cột Trạng thái */}
              <th
                onClick={() => onSort?.('status')}
                className={`py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group/col ${
                  sortField === 'status' ? 'text-brand-600 bg-brand-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Trạng thái</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              {/* Cột Hạn hợp đồng */}
              <th
                onClick={() => onSort?.('endDate')}
                className={`py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors group/col ${
                  sortField === 'endDate' ? 'text-brand-600 bg-brand-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Hạn hợp đồng</span>
                  {renderSortIcon('endDate')}
                </div>
              </th>

              {/* Cột Thao tác */}
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {contracts.map((c) => {
              const isOverdue = c.status === 'OVERDUE';
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectContract(c)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Mã hợp đồng */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 text-slate-500 flex items-center justify-center transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-sm">
                          {c.code}
                        </span>
                        {c.startDate && (
                          <p className="text-[10px] text-slate-400">Từ: {c.startDate}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Khách thuê */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{c.customerName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{c.customerPhone}</div>
                  </td>

                  {/* Ô kho */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <Box className="w-3 h-3 text-slate-400" />
                      <span>{c.storageUnitCode || `Ô #${c.storageUnitId}`}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {c.unitTypeName || 'Kho tiêu chuẩn'}
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={c.status} size="sm" />
                    {isOverdue && c.overdueDays !== undefined && (
                      <span className="block text-[10px] font-bold text-rose-600 mt-0.5">
                        Quá hạn {c.overdueDays} ngày
                      </span>
                    )}
                  </td>

                  {/* Hạn hợp đồng */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{c.endDateExclusive || '—'}</span>
                    </div>
                    {c.daysRemaining !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          c.daysRemaining <= 7
                            ? 'bg-amber-100 text-amber-800'
                            : 'text-slate-500'
                        }`}
                      >
                        {c.daysRemaining >= 0
                          ? `Còn ${c.daysRemaining} ngày`
                          : `Quá hạn ${Math.abs(c.daysRemaining)} ngày`}
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectContract(c);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-brand-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi tiết</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
