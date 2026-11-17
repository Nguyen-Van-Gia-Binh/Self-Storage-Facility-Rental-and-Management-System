// frontend/src/features/manager/components/ContractTable.tsx
import React from 'react';
import {
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import type { ManagerContractItem } from '@/types/contractManager';
import { formatDateVN } from '@/features/customer/utils/unitPickerHelpers';
import { StatusBadge } from './StatusBadge';

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return '—';
  const trimmed = iso.trim();
  return /^\d{4}-\d{2}-\d{2}/.test(trimmed) ? formatDateVN(trimmed.slice(0, 10)) : trimmed;
}

export type ContractSortField = 'code' | 'customer' | 'unit' | 'status' | 'endDate';
export type SortDirection = 'asc' | 'desc';

interface ContractTableProps {
  contracts: ManagerContractItem[];
  onSelectContract: (contract: ManagerContractItem) => void;
  onApproveSettlement?: (contract: ManagerContractItem) => void;
  sortField?: ContractSortField;
  sortDirection?: SortDirection;
  onSort?: (field: ContractSortField) => void;
}

export const ContractTable: React.FC<ContractTableProps> = ({
  contracts,
  onSelectContract,
  onApproveSettlement,
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
          <tbody className="divide-y divide-gray-100 text-xs">
            {contracts.map((c) => {
              const isOverdue = c.status === 'OVERDUE';
              const isClosedRow = c.status === 'CLOSED';
              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectContract(c)}
                  className={`transition-colors cursor-pointer group ${
                    isClosedRow ? 'bg-gray-50 opacity-75 hover:bg-gray-100/70' : 'bg-white hover:bg-gray-50/80'
                  }`}
                >
                  {/* Mã hợp đồng */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-gray-900 group-hover:text-brand-600 transition-colors text-sm block">
                      {c.code}
                    </span>
                    {c.startDate && (
                      <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                        Từ: {formatDisplayDate(c.startDate)}
                      </p>
                    )}
                  </td>

                  {/* Khách thuê */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900">{c.customerName}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 tabular-nums">{c.customerPhone}</div>
                  </td>

                  {/* Ô kho */}
                  <td className="py-3.5 px-4">
                    {c.status === 'RELOCATION_PENDING' || (c.relocationEligible && c.status === 'PENDING_CHECK_IN') || !c.storageUnitCode ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-xs w-fit">
                          Chờ cấp ô mới
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {c.unitTypeName || 'Kho tiêu chuẩn'}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-mono font-bold text-gray-900 block text-sm">
                          {c.storageUnitCode}
                        </span>
                        <span className="text-[11px] text-gray-500 mt-0.5 block">
                          {c.unitTypeName || 'Kho tiêu chuẩn'}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Trạng thái (Semantic Soft Badges) */}
                  <td className="py-3.5 px-4">
                    <StatusBadge
                      status={c.status}
                      size="sm"
                      customLabel={
                        c.status === 'CANCELLED' ? 'Hủy · Chờ hoàn tiền' : undefined
                      }
                    />
                    {isOverdue && c.overdueDays !== undefined && (
                      <span className="block text-[11px] font-semibold text-rose-600 mt-0.5">
                        Quá hạn {c.overdueDays} ngày
                      </span>
                    )}
                  </td>

                  {/* Hạn hợp đồng (Định dạng chuẩn DD/MM/YYYY) */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-900 tabular-nums">
                      {formatDisplayDate(c.endDateExclusive)}
                    </div>
                    {(c.status === 'ACTIVE' || c.status === 'PENDING_CHECK_IN') && c.daysRemaining !== undefined && (
                      <span
                        className={`text-[11px] font-medium mt-0.5 inline-block ${
                          c.daysRemaining <= 7
                            ? 'text-amber-700 font-semibold'
                            : 'text-gray-400'
                        }`}
                      >
                        {c.daysRemaining > 0
                          ? `Còn ${c.daysRemaining} ngày`
                          : 'Hết hạn hôm nay'}
                      </span>
                    )}
                    {c.status === 'OVERDUE' && (
                      <span className="text-[11px] font-medium text-rose-600 mt-0.5 block">
                        Đã hết hạn
                      </span>
                    )}
                    {c.status === 'CLOSED' && (
                      <span className="text-[11px] font-medium text-gray-400 mt-0.5 block">
                        Đã tất toán
                      </span>
                    )}
                    {c.status === 'TERMINATED' && (
                      <span className="text-[11px] font-medium text-rose-600 mt-0.5 block">
                        Đã chấm dứt
                      </span>
                    )}
                    {(c.status === 'INSPECTED' || c.status === 'CANCELLED') && (
                      <span className="text-[11px] font-medium text-amber-600 mt-0.5 block">
                        Chờ quyết toán
                      </span>
                    )}
                    {c.status === 'PENDING_RETURN' && (
                      <span className="text-[11px] font-medium text-blue-600 mt-0.5 block">
                        {c.assignedStaffId ? 'Chờ nghiệm thu' : 'Chờ phân bổ'}
                      </span>
                    )}
                  </td>

                  {/* Thao tác (Primary Mint cho Duyệt quyết toán, Outline xám cho Chi tiết) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {onApproveSettlement &&
                        (c.status === 'INSPECTED' ||
                          c.status === 'TERMINATED' ||
                          c.status === 'CANCELLED') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApproveSettlement(c);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                            title="Mở bảng phê duyệt quyết toán và hoàn tiền"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Duyệt quyết toán</span>
                          </button>
                        )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectContract(c);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
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
