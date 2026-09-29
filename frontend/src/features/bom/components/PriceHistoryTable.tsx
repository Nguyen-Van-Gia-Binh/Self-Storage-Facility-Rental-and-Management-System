// frontend/src/features/bom/components/PriceHistoryTable.tsx
import React from 'react';
import { History, AlertCircle } from 'lucide-react';
import type { FacilityListItem, UnitTypeCatalog } from '@/types';
import type { PriceVersionItem } from '@/api/pricing';

interface PriceHistoryTableProps {
  facilities: FacilityListItem[];
  selectedFacilityId: number;
  onSelectFacility: (id: number) => void;
  unitTypes: UnitTypeCatalog[];
  filterUnitTypeId: number | 'ALL';
  onFilterUnitType: (id: number | 'ALL') => void;
  versions: PriceVersionItem[];
  isLoading?: boolean;
}

function statusBadgeClass(status: string): string {
  if (status === 'Đang áp dụng') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Chưa áp dụng') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'Đã thay thế') return 'bg-slate-50 text-slate-600 border-slate-200';
  return 'bg-slate-50 text-slate-500 border-slate-200';
}

export const PriceHistoryTable: React.FC<PriceHistoryTableProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  unitTypes,
  filterUnitTypeId,
  onFilterUnitType,
  versions,
  isLoading = false,
}) => {
  const activeFacilities = facilities.filter((f) => f.isActive);
  const selectedFacility = activeFacilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Lịch sử giá theo cơ sở
            </label>
            <p className="text-sm font-bold text-slate-900">
              {selectedFacility ? selectedFacility.name : 'Đang chọn cơ sở...'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <select
            value={selectedFacilityId}
            onChange={(e) => onSelectFacility(Number(e.target.value))}
            className="w-full sm:w-64 text-sm font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          >
            {activeFacilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>
          <select
            value={filterUnitTypeId === 'ALL' ? 'ALL' : String(filterUnitTypeId)}
            onChange={(e) =>
              onFilterUnitType(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="w-full sm:w-56 text-sm font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          >
            <option value="ALL">Tất cả loại ô kho</option>
            {unitTypes.map((ut) => (
              <option key={ut.id} value={ut.id}>
                {ut.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Loại ô kho</th>
                <th className="py-3.5 px-4">Ngày hiệu lực</th>
                <th className="py-3.5 px-4 text-right">Đơn giá m²</th>
                <th className="py-3.5 px-4 text-right">Giá thuê tháng</th>
                <th className="py-3.5 px-4 text-center">Tình trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    Đang tải lịch sử giá...
                  </td>
                </tr>
              ) : versions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Chưa có phiên bản giá nào</p>
                  </td>
                </tr>
              ) : (
                versions.map((v) => (
                  <tr key={v.id} className="hover:bg-violet-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {v.unitTypeName || `Loại #${v.unitTypeId}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {v.effectiveFrom}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium">
                      {v.pricePerM2.toLocaleString('vi-VN')}{' '}
                      <span className="text-xs text-slate-400">VND/m²</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                      {v.monthlyPrice.toLocaleString('vi-VN')}{' '}
                      <span className="text-xs font-normal text-slate-400">VND</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusBadgeClass(v.status)}`}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
