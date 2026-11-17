// frontend/src/features/manager/components/StorageUnitTable.tsx
import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { StorageUnitResponse, UnitStatus } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';

export type StorageUnitSortField = 'code' | 'floor' | 'status' | 'customer' | 'endDate';
export type SortDirection = 'asc' | 'desc';

interface StorageUnitTableProps {
  units: StorageUnitResponse[];
  contractsMap?: Record<number, ManagerContractItem>;
  onSelectUnit: (unit: StorageUnitResponse) => void;
  onStatusChange?: (unit: StorageUnitResponse, status: UnitStatus) => void;
  sortField?: StorageUnitSortField;
  sortDirection?: SortDirection;
  onSort?: (field: StorageUnitSortField) => void;
}

const FLAT_STATUS_META: Record<
  string,
  { label: string; dotClass: string; textClass: string }
> = {
  AVAILABLE: { label: 'Trống', dotClass: 'bg-emerald-600', textClass: 'text-emerald-700' },
  OCCUPIED: { label: 'Đang thuê', dotClass: 'bg-blue-600', textClass: 'text-blue-700' },
  RESERVED: { label: 'Đã đặt', dotClass: 'bg-sky-600', textClass: 'text-sky-700' },
  MAINTENANCE: { label: 'Bảo trì', dotClass: 'bg-rose-600', textClass: 'text-rose-700' },
  OVERDUE: { label: 'Quá hạn', dotClass: 'bg-rose-600', textClass: 'text-rose-700' },
  LOCKED: { label: 'Đã khóa', dotClass: 'bg-rose-600', textClass: 'text-rose-700' },
};

export const StorageUnitTable: React.FC<StorageUnitTableProps> = ({
  units,
  contractsMap = {},
  onSelectUnit,
  onStatusChange,
  sortField,
  sortDirection = 'asc',
  onSort,
}) => {
  if (units.length === 0) {
    return (
      <div className="bg-white rounded-md border border-gray-200 py-10 px-6 text-center">
        <h3 className="text-sm font-semibold text-gray-800">Không có ô kho nào phù hợp</h3>
        <p className="text-xs text-gray-500 mt-1">
          Chưa có ô kho vật lý nào khớp với bộ lọc và từ khóa được chọn.
        </p>
      </div>
    );
  }

  const renderSortIcon = (field: StorageUnitSortField) => {
    if (!onSort) return null;
    if (sortField === field) {
      return sortDirection === 'asc' ? (
        <ArrowUp className="w-3.5 h-3.5 text-brand-700 shrink-0" />
      ) : (
        <ArrowDown className="w-3.5 h-3.5 text-brand-700 shrink-0" />
      );
    }
    return (
      <ArrowUpDown className="w-3.5 h-3.5 text-gray-300 group-hover/col:text-gray-500 shrink-0" />
    );
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/90 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider select-none">
              <th
                onClick={() => onSort?.('code')}
                className={`py-2.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors group/col ${
                  sortField === 'code' ? 'text-brand-700' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Mã ô kho</span>
                  {renderSortIcon('code')}
                </div>
              </th>

              <th
                onClick={() => onSort?.('floor')}
                className={`py-2.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors group/col ${
                  sortField === 'floor' ? 'text-brand-700' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Tầng / Vị trí</span>
                  {renderSortIcon('floor')}
                </div>
              </th>

              <th
                onClick={() => onSort?.('status')}
                className={`py-2.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors group/col ${
                  sortField === 'status' ? 'text-brand-700' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Trạng thái</span>
                  {renderSortIcon('status')}
                </div>
              </th>

              <th
                onClick={() => onSort?.('customer')}
                className={`py-2.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors group/col ${
                  sortField === 'customer' ? 'text-brand-700' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Khách thuê</span>
                  {renderSortIcon('customer')}
                </div>
              </th>

              <th
                onClick={() => onSort?.('endDate')}
                className={`py-2.5 px-4 cursor-pointer hover:bg-gray-100/80 transition-colors group/col ${
                  sortField === 'endDate' ? 'text-brand-700' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>Hạn HĐ</span>
                  {renderSortIcon('endDate')}
                </div>
              </th>

              <th className="py-2.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs">
            {units.map((unit) => {
              const contract = contractsMap[unit.id];
              const isOccupied = unit.status === 'OCCUPIED';
              const statusMeta = FLAT_STATUS_META[unit.status] || {
                label: unit.status,
                dotClass: 'bg-gray-400',
                textClass: 'text-gray-600',
              };
              const floorLabel = `Tầng ${unit.floor ?? 1}`;
              const locationDisplay = unit.position
                ? `${floorLabel}, ${unit.position}`
                : floorLabel;

              return (
                <tr
                  key={unit.id}
                  onClick={() => onSelectUnit(unit)}
                  className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                >
                  {/* Mã ô kho — gọn gàng, không lặp locationNote, không hộp icon thừa */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors text-sm">
                      {unit.code}
                    </span>
                  </td>

                  {/* Tầng / Vị trí — căn trái, rút gọn 1 dòng */}
                  <td className="py-2.5 px-4 text-gray-700 whitespace-nowrap">
                    {locationDisplay}
                  </td>

                  {/* Trạng thái — Flat UI (chấm nhỏ + chữ màu, không nền pastel) */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.textClass}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dotClass}`}
                        aria-hidden="true"
                      />
                      <span>{statusMeta.label}</span>
                    </span>
                  </td>

                  {/* Khách thuê */}
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {contract && isOccupied ? (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-900">{contract.customerName}</span>
                        {contract.customerPhone && (
                          <span className="text-gray-400">({contract.customerPhone})</span>
                        )}
                      </div>
                    ) : isOccupied ? (
                      <span className="text-amber-700 font-medium">Chưa gắn HĐ</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Hạn hợp đồng */}
                  <td className="py-2.5 px-4 whitespace-nowrap tabular-nums">
                    {contract && isOccupied ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{contract.endDateExclusive}</span>
                        {contract.daysRemaining !== undefined && (
                          <span
                            className={`text-[11px] font-medium ${
                              contract.status === 'OVERDUE'
                                ? 'text-rose-600'
                                : contract.daysRemaining <= 7
                                ? 'text-amber-700'
                                : 'text-gray-500'
                            }`}
                          >
                            (
                            {contract.daysRemaining >= 0
                              ? `còn ${contract.daysRemaining} ngày`
                              : contract.status === 'OVERDUE'
                              ? `quá hạn ${Math.abs(contract.daysRemaining)} ngày`
                              : contract.status === 'CLOSED'
                              ? 'đã tất toán'
                              : contract.status === 'TERMINATED'
                              ? 'đã chấm dứt'
                              : 'hết hạn'}
                            )
                          </span>
                        )}
                      </div>
                    ) : isOccupied ? (
                      <span className="text-amber-700 font-medium">Chưa gắn HĐ</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* Thao tác — Text link tinh gọn, không viền hộp màu mè */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-3">
                      {unit.status === 'AVAILABLE' && onStatusChange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(unit, 'MAINTENANCE');
                          }}
                          className="text-xs font-medium text-gray-500 hover:text-amber-700 hover:underline underline-offset-2 transition-colors cursor-pointer"
                          title="Chuyển sang bảo trì"
                        >
                          Bảo trì
                        </button>
                      )}
                      {unit.status === 'MAINTENANCE' && onStatusChange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(unit, 'AVAILABLE');
                          }}
                          className="text-xs font-medium text-gray-500 hover:text-emerald-700 hover:underline underline-offset-2 transition-colors cursor-pointer"
                          title="Hoàn tất bảo trì → Sẵn sàng"
                        >
                          Sẵn sàng
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUnit(unit);
                        }}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-800 hover:underline underline-offset-2 transition-colors cursor-pointer"
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
