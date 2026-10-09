import { Box, User, Calendar, Eye } from 'lucide-react';
import type { StorageUnitResponse, UnitStatus } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';
import { StatusBadge } from './StatusBadge';

interface StorageUnitTableProps {
  units: StorageUnitResponse[];
  contractsMap?: Record<number, ManagerContractItem>;
  onSelectUnit: (unit: StorageUnitResponse) => void;
  onStatusChange?: (unit: StorageUnitResponse, status: UnitStatus) => void;
}

export const StorageUnitTable: React.FC<StorageUnitTableProps> = ({
  units,
  contractsMap = {},
  onSelectUnit,
  onStatusChange,
}) => {
  if (units.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Box className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Không có ô kho nào phù hợp</h3>
        <p className="text-xs text-slate-500 mt-1">
          Chưa có ô kho vật lý nào khớp với bộ lọc trạng thái được chọn.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Mã ô kho</th>
              <th className="py-3.5 px-4">Tầng / Vị trí</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4">Khách thuê hiện tại</th>
              <th className="py-3.5 px-4">Hạn hợp đồng</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {units.map((unit) => {
              const contract = contractsMap[unit.id];
              const isOccupied = unit.status === 'OCCUPIED';

              return (
                <tr
                  key={unit.id}
                  onClick={() => onSelectUnit(unit)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Mã ô kho */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-brand-50 group-hover:text-brand-600 text-slate-500 flex items-center justify-center transition-colors">
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-sm">
                          {unit.code}
                        </span>
                        {unit.locationNote && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {unit.locationNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tầng / Vị trí */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      Tầng {unit.floor ?? 1}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {unit.position || 'Chưa định vị'}
                    </div>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={unit.status} size="sm" />
                  </td>

                  {/* Khách thuê */}
                  <td className="py-3.5 px-4">
                    {contract && isOccupied ? (
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{contract.customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {contract.customerPhone}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Hạn hợp đồng */}
                  <td className="py-3.5 px-4">
                    {contract && isOccupied ? (
                      <div>
                        <div className="font-medium text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{contract.endDateExclusive}</span>
                        </div>
                        {contract.daysRemaining !== undefined && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              contract.daysRemaining <= 7
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-slate-500'
                            }`}
                          >
                            {contract.daysRemaining >= 0
                              ? `Còn ${contract.daysRemaining} ngày`
                              : `Quá hạn ${Math.abs(contract.daysRemaining)} ngày`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {unit.status === 'AVAILABLE' && onStatusChange && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(unit, 'MAINTENANCE');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-amber-700 hover:bg-amber-50 rounded-lg border border-amber-200 transition-colors cursor-pointer"
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
                          className="px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          title="Hoàn tất bảo trì -> Sẵn sàng"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-brand-200 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
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
