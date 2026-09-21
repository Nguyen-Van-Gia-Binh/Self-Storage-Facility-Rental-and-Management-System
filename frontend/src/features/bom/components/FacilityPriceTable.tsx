// frontend/src/features/bom/components/FacilityPriceTable.tsx
import React from 'react';
import { Building2, Layers, Edit3, AlertCircle } from 'lucide-react';
import type { FacilityListItem, UnitTypeCatalog } from '@/types';

interface FacilityPriceTableProps {
  facilities: FacilityListItem[];
  selectedFacilityId: number;
  onSelectFacility: (id: number) => void;
  unitTypes: UnitTypeCatalog[];
  onOpenPriceModal: (unitType: UnitTypeCatalog) => void;
  isLoading?: boolean;
}

export const FacilityPriceTable: React.FC<FacilityPriceTableProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  unitTypes,
  onOpenPriceModal,
  isLoading = false,
}) => {
  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-4">
      {/* Facility Selector Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Chọn cơ sở xem bảng giá
            </label>
            <p className="text-sm font-bold text-slate-900">
              {selectedFacility ? selectedFacility.name : 'Đang chọn cơ sở...'}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedFacilityId}
            onChange={(e) => onSelectFacility(Number(e.target.value))}
            className="w-full text-sm font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} {fac.isActive ? '' : '(Ngừng khai thác)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table of Unit Types */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Loại ô kho</th>
                <th className="py-3.5 px-4">Kích thước (R × D × C)</th>
                <th className="py-3.5 px-4">Diện tích</th>
                <th className="py-3.5 px-4 text-right">Đơn giá tháng (VND)</th>
                <th className="py-3.5 px-4 text-center">Tổng ô kho</th>
                <th className="py-3.5 px-4 text-center">Tình trạng giá</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <div className="inline-block p-2 rounded-xl bg-amber-50 text-amber-500 animate-pulse mb-2">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p>Đang tải danh sách loại ô kho và đơn giá...</p>
                  </td>
                </tr>
              ) : unitTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">
                      Cơ sở này chưa có loại ô kho nào được khai báo
                    </p>
                  </td>
                </tr>
              ) : (
                unitTypes.map((ut) => (
                  <tr key={ut.id} className="hover:bg-amber-50/30 transition-colors group">
                    {/* Tên loại ô kho */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {ut.name}
                          </p>
                          {ut.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-xs">
                              {ut.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Kích thước */}
                    <td className="py-4 px-4 font-mono text-xs text-slate-600">
                      {ut.widthM}m × {ut.depthM}m × {ut.heightM}m
                    </td>

                    {/* Diện tích */}
                    <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                      {ut.areaM2} m²
                    </td>

                    {/* Đơn giá tháng */}
                    <td className="py-4 px-4 text-right">
                      {ut.monthlyPrice > 0 ? (
                        <div className="font-bold text-amber-600 text-sm">
                          {ut.monthlyPrice.toLocaleString('vi-VN')}{' '}
                          <span className="text-xs font-normal text-slate-400">VND/tháng</span>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                          Chưa niêm yết giá
                        </span>
                      )}
                    </td>

                    {/* Tổng số ô kho */}
                    <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-slate-600">
                      {ut.totalUnits} ô
                    </td>

                    {/* Trạng thái niêm yết */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ut.monthlyPrice > 0 && ut.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ut.monthlyPrice > 0 && ut.isActive ? 'Đang mở bán' : 'Chưa áp dụng'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onOpenPriceModal(ut)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-800 rounded-lg border border-amber-200 transition-colors shadow-sm"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Đổi giá</span>
                      </button>
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
