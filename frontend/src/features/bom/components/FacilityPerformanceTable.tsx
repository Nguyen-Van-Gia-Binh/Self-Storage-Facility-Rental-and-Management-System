import React from 'react';
import { Building2, TrendingUp, ChevronRight } from 'lucide-react';
import type { FacilityRevenueBreakdown, FacilityOccupancyItem } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/format';

export interface FacilityPerformanceTableProps {
  revenues: FacilityRevenueBreakdown[];
  occupancies: FacilityOccupancyItem[];
  onSelectFacility?: (facilityId: number) => void;
  isLoading?: boolean;
}

export const FacilityPerformanceTable: React.FC<FacilityPerformanceTableProps> = ({
  revenues,
  occupancies,
  onSelectFacility,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="h-48 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  // Khớp dữ liệu doanh thu và lấp đầy theo facilityId
  const money = (value: number | undefined | null) => (Number.isFinite(Number(value)) ? Number(value) : 0);

  const rows = revenues.map((rev) => {
    const occ = occupancies.find((o) => o.facilityId === rev.facilityId);
    const rentalRevenue = money(rev.rentalRevenue);
    const surchargeRevenue = money(rev.surchargeRevenue);
    const renewalRevenue = money(rev.renewalRevenue);
    const overdueFeeRevenue = money(rev.overdueFeeRevenue);
    const totalRevenue = money(rev.totalRevenue) || rentalRevenue + surchargeRevenue + renewalRevenue + overdueFeeRevenue;
    return {
      facilityId: rev.facilityId,
      facilityName: rev.facilityName,
      rentalRevenue,
      surchargesAndRenewals: surchargeRevenue + renewalRevenue,
      overdueFeeRevenue,
      totalRevenue,
      occupancyRate: occ ? occ.occupancyRate : 0,
      occupiedUnits: occ ? occ.occupiedUnits : 0,
      availableUnits: occ ? occ.availableUnits : 0,
      totalUnits: occ ? occ.totalUnits : 0,
      overdueCount: occ ? occ.overdueContractsCount : 0,
    };
  });

  // Tính tổng hàng cuối (System Total Row) - US-BM-04.1 AC-2
  const totalRental = rows.reduce((acc, r) => acc + r.rentalRevenue, 0);
  const totalSurcharges = rows.reduce((acc, r) => acc + r.surchargesAndRenewals, 0);
  const totalOverdueFees = rows.reduce((acc, r) => acc + r.overdueFeeRevenue, 0);
  const grandTotalRevenue = rows.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalOccupied = rows.reduce((acc, r) => acc + r.occupiedUnits, 0);
  const totalAvailable = rows.reduce((acc, r) => acc + r.availableUnits, 0);
  const totalCapacity = rows.reduce((acc, r) => acc + r.totalUnits, 0);
  const averageOccupancy = totalCapacity > 0 ? totalOccupied / totalCapacity : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Ma Trận So Sánh Hiệu Quả & Doanh Thu Từng Cơ Sở
            </h3>
            <p className="text-xs text-slate-500">
              Đa chiều theo Facility, Unit Type và trạng thái dòng tiền (US-BM-05.1 AC-1)
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Cơ sở lưu kho</th>
              <th className="py-3 px-3 text-right">Tiền thuê kho</th>
              <th className="py-3 px-3 text-right">Phụ phí & Gia hạn</th>
              <th className="py-3 px-3 text-right">Phí quá hạn</th>
              <th className="py-3 px-3 text-right">Tổng thực thu</th>
              <th className="py-3 px-3 text-center">Tỷ lệ lấp đầy</th>
              <th className="py-3 px-3 text-center">Ô trống / Tổng</th>
              <th className="py-3 px-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => {
              const occPercent = (row.occupancyRate * 100).toFixed(1);
              return (
                <tr
                  key={row.facilityId}
                  className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                  onClick={() => onSelectFacility && onSelectFacility(row.facilityId)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" />
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {row.facilityName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Mã cơ sở: #{row.facilityId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                    {formatCurrency(row.rentalRevenue)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {formatCurrency(row.surchargesAndRenewals)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {row.overdueFeeRevenue > 0 ? (
                      <span className="text-rose-600 font-semibold">
                        {formatCurrency(row.overdueFeeRevenue)}
                      </span>
                    ) : (
                      <span className="text-slate-400">0 ₫</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(row.totalRevenue)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-semibold text-[11px] border ${
                        row.occupancyRate >= 0.8
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.occupancyRate >= 0.5
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {occPercent}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-600">
                    <span className="text-emerald-600 font-semibold">{row.availableUnits}</span>
                    <span className="text-slate-400"> / </span>
                    <span>{row.totalUnits} ô</span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Xem chi tiết cơ sở"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
            <tr>
              <td className="py-3.5 px-4 text-xs uppercase tracking-wide">
                TỔNG CỘNG TOÀN HỆ THỐNG
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-slate-900">
                {formatCurrency(totalRental)}
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-slate-900">
                {formatCurrency(totalSurcharges)}
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-rose-600">
                {formatCurrency(totalOverdueFees)}
              </td>
              <td className="py-3.5 px-3 text-right font-mono text-brand-600 text-sm">
                {formatCurrency(grandTotalRevenue)}
              </td>
              <td className="py-3.5 px-3 text-center font-mono text-slate-900">
                {formatPercent(averageOccupancy)}
              </td>
              <td className="py-3.5 px-3 text-center font-mono text-slate-900">
                {totalAvailable} trống / {totalCapacity} ô
              </td>
              <td className="py-3.5 px-3 text-center text-slate-400 text-[11px]">
                3 Cơ sở
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
