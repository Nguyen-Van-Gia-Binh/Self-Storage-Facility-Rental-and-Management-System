// frontend/src/features/bom/components/FacilityPriceTable.tsx
import React from 'react';
import { Link } from 'react-router-dom';
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

function statusBadgeClass(status?: string | null): string {
  if (status === 'Đang áp dụng') {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  if (status === 'Chưa áp dụng') {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  return 'bg-slate-50 text-slate-600 border border-slate-200';
}

export const FacilityPriceTable: React.FC<FacilityPriceTableProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  unitTypes,
  onOpenPriceModal,
  isLoading = false,
}) => {
  const activeFacilities = facilities.filter((f) => f.isActive);
  const selectedFacility = activeFacilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-4">
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
            <Link to="/bom/price-audit" className="text-xs font-semibold text-amber-700 hover:text-amber-800">
              Xem nhật ký đầy đủ
            </Link>
          </div>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedFacilityId}
            onChange={(e) => onSelectFacility(Number(e.target.value))}
            className="w-full text-sm font-medium border border-slate-300 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer"
          >
            {activeFacilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
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
                <th className="py-3.5 px-4">Kích thước (R × D × C)</th>
                <th className="py-3.5 px-4">Diện tích</th>
                <th className="py-3.5 px-4 text-right">Đơn giá (VND/m²/tháng)</th>
                <th className="py-3.5 px-4 text-right">Giá thuê / tháng</th>
                <th className="py-3.5 px-4 text-center">Tổng ô kho</th>
                <th className="py-3.5 px-4 text-center">Tình trạng giá</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <div className="inline-block p-2 rounded-xl bg-amber-50 text-amber-500 animate-pulse mb-2">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p>Đang tải danh sách loại ô kho và đơn giá...</p>
                  </td>
                </tr>
              ) : unitTypes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-sm">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">
                      Cơ sở này chưa có loại ô kho nào được khai báo
                    </p>
                  </td>
                </tr>
              ) : (
                unitTypes.map((ut) => {
                  const status = ut.priceStatus
                    ?? (ut.monthlyPrice > 0 ? 'Đang áp dụng' : 'Chưa niêm yết');
                  return (
                    <tr key={ut.id} className="hover:bg-amber-50/30 transition-colors group">
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

                      <td className="py-4 px-4 font-mono text-xs text-slate-600">
                        {ut.widthM}m × {ut.depthM}m × {ut.heightM}m
                      </td>

                      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                        {ut.areaM2} m²
                      </td>

                      <td className="py-4 px-4 text-right">
                        {(() => {
                          const rate =
                            ut.pricePerM2 != null && ut.pricePerM2 > 0
                              ? ut.pricePerM2
                              : status === 'Chưa áp dụng' && ut.scheduledPricePerM2
                                ? ut.scheduledPricePerM2
                                : ut.areaM2 > 0 && ut.monthlyPrice > 0
                                  ? Math.round(ut.monthlyPrice / ut.areaM2)
                                  : null;
                          return rate != null && rate > 0 ? (
                            <div className="font-bold text-slate-800 text-sm">
                              {rate.toLocaleString('vi-VN')}{' '}
                              <span className="text-xs font-normal text-slate-400">VND/m²</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          );
                        })()}
                      </td>

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

                      <td className="py-4 px-4 text-center font-mono text-xs font-semibold text-slate-600">
                        {ut.totalUnits} ô
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(status)}`}
                          >
                            {status}
                          </span>
                          {status === 'Đang áp dụng' && ut.scheduledEffectiveFrom && (
                            <span className="text-[10px] text-slate-500">
                              Giá mới bắt đầu từ {ut.scheduledEffectiveFrom}
                              {ut.scheduledPricePerM2 != null
                                ? ` · ${ut.scheduledPricePerM2.toLocaleString('vi-VN')} VND/m²`
                                : ''}
                            </span>
                          )}
                        </div>
                      </td>

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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
