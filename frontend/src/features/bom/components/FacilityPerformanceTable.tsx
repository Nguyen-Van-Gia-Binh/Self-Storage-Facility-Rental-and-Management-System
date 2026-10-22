import React, { useState, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import type { FacilityRevenueBreakdown, FacilityOccupancyItem } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { FacilityPerformanceData } from './FacilityPerformanceDrawer';

export interface FacilityPerformanceTableProps {
  revenues: FacilityRevenueBreakdown[];
  occupancies: FacilityOccupancyItem[];
  onSelectFacility?: (facilityId: number) => void;
  onOpenDetail?: (facility: FacilityPerformanceData) => void;
  highlightedStream?: string | null;
  onClearHighlight?: () => void;
  isLoading?: boolean;
}

type SortField =
  | 'facilityName'
  | 'rentalRevenue'
  | 'surchargesAndRenewals'
  | 'overdueFeeRevenue'
  | 'totalRevenue'
  | 'occupancyRate';

type SortDirection = 'asc' | 'desc';

/** Định dạng số tiền: Nếu bằng 0 thì hiển thị dấu gạch ngang '-', ngược lại hiển thị tiền */
function formatMoneyOrDash(value: number): React.ReactNode {
  if (value === 0) {
    return <span className="text-slate-400 font-normal">-</span>;
  }
  return formatCurrency(value);
}

export const FacilityPerformanceTable: React.FC<FacilityPerformanceTableProps> = ({
  revenues,
  occupancies,
  onSelectFacility,
  onOpenDetail,
  highlightedStream = null,
  onClearHighlight,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const money = (value: number | undefined | null) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;

  // Khớp dữ liệu doanh thu và lấp đầy theo facilityId
  const allRows: FacilityPerformanceData[] = revenues.map((rev) => {
    const occ = occupancies.find((o) => o.facilityId === rev.facilityId);
    const rentalRevenue = money(rev.rentalRevenue);
    const surchargeRevenue = money(rev.surchargeRevenue);
    const renewalRevenue = money(rev.renewalRevenue);
    const overdueFeeRevenue = money(rev.overdueFeeRevenue);
    const depositBalance = money(rev.depositBalance);
    const refundAmount = money(rev.refundAmount);
    const totalRevenue =
      money(rev.totalRevenue) ||
      rentalRevenue + surchargeRevenue + renewalRevenue + overdueFeeRevenue;

    return {
      facilityId: rev.facilityId,
      facilityName: rev.facilityName,
      rentalRevenue,
      surchargeRevenue,
      renewalRevenue,
      overdueFeeRevenue,
      depositBalance,
      refundAmount,
      totalRevenue,
      occupancyRate: occ ? occ.occupancyRate : 0,
      occupiedUnits: occ ? money(occ.occupiedUnits) : 0,
      availableUnits: occ ? money(occ.availableUnits) : 0,
      outOfServiceUnits: occ ? money(occ.outOfServiceUnits) : 0,
      totalUnits: occ ? money(occ.totalUnits) : 0,
      overdueCount: occ ? money(occ.overdueContractsCount) : 0,
    };
  });

  const exploitableOf = (source: { totalUnits: number; outOfServiceUnits: number }) =>
    Math.max(0, source.totalUnits - source.outOfServiceUnits);

  // Lọc theo từ khóa tìm kiếm
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return allRows;
    const term = searchTerm.toLowerCase().trim();
    return allRows.filter(
      (r) =>
        r.facilityName.toLowerCase().includes(term) ||
        String(r.facilityId).includes(term)
    );
  }, [allRows, searchTerm]);

  // Sắp xếp dữ liệu
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'facilityName':
          aVal = a.facilityName.toLowerCase();
          bVal = b.facilityName.toLowerCase();
          break;
        case 'rentalRevenue':
          aVal = a.rentalRevenue;
          bVal = b.rentalRevenue;
          break;
        case 'surchargesAndRenewals':
          aVal = a.surchargeRevenue + a.renewalRevenue;
          bVal = b.surchargeRevenue + b.renewalRevenue;
          break;
        case 'overdueFeeRevenue':
          aVal = a.overdueFeeRevenue;
          bVal = b.overdueFeeRevenue;
          break;
        case 'totalRevenue':
          aVal = a.totalRevenue;
          bVal = b.totalRevenue;
          break;
        case 'occupancyRate':
          aVal = a.occupancyRate;
          bVal = b.occupancyRate;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [filteredRows, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc'); // mặc định giảm dần cho số liệu kinh tế
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-600 ml-1 inline" />
    );
  };

  // Tính tổng hàng cuối (Total Row toàn hệ thống)
  const totalRental = allRows.reduce((acc, r) => acc + r.rentalRevenue, 0);
  const totalSurchargesAndRenewals = allRows.reduce(
    (acc, r) => acc + r.surchargeRevenue + r.renewalRevenue,
    0
  );
  const totalOverdueFees = allRows.reduce((acc, r) => acc + r.overdueFeeRevenue, 0);
  const grandTotalRevenue = allRows.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalOccupied = allRows.reduce((acc, r) => acc + r.occupiedUnits, 0);
  const totalAvailable = allRows.reduce((acc, r) => acc + r.availableUnits, 0);
  const totalExploitable = allRows.reduce((acc, r) => acc + exploitableOf(r), 0);
  const averageOccupancy = totalExploitable > 0 ? totalOccupied / totalExploitable : null;

  // Trạng thái highlight cột theo Lọc chéo (Cross-filtering)
  const isRentalHighlighted = highlightedStream === 'rental';
  const isSurchargeHighlighted = highlightedStream === 'surcharge' || highlightedStream === 'renewal';
  const isOverdueHighlighted = highlightedStream === 'overdue';
  const isAnyStreamHighlighted = highlightedStream !== null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden space-y-0">
      {/* Header Bảng & Thanh công cụ Search + Filter State */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Ma Trận Doanh Thu & Hiệu Quả Từng Cơ Sở
              </h3>
              {isAnyStreamHighlighted && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
                  <span>Lọc chéo cột: <strong>{highlightedStream}</strong></span>
                  <button
                    type="button"
                    onClick={onClearHighlight}
                    className="hover:text-indigo-900 ml-0.5"
                    title="Bỏ lọc chéo cột"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Định dạng số Tabular Nums chuẩn doanh nghiệp. Bấm vào tên cơ sở để lọc toàn trang, hoặc bấm [Xem chi tiết] để xem nhanh.
            </p>
          </div>
        </div>

        {/* Thanh tìm kiếm cơ sở */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mã cơ sở..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu với Super-headers (2 tầng Thead) & Sticky Total Footer */}
      <div className="overflow-x-auto max-h-[560px]">
        <table className="w-full text-left text-xs border-collapse">
          {/* TẦNG 1 & TẦNG 2 CỦA THEAD (SUPER-HEADERS) */}
          <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm border-b border-slate-200">
            {/* Tầng 1: Super Header Nhóm */}
            <tr className="border-b border-slate-200/80 text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-slate-100/70">
              <th scope="col" className="py-2 px-4 border-r border-slate-200/60">
                Thông tin cơ sở
              </th>
              <th
                scope="col"
                colSpan={4}
                className="py-2 px-3 text-center border-r border-slate-200/60 text-slate-700 bg-slate-100"
              >
                Cơ cấu dòng tiền (₫)
              </th>
              <th
                scope="col"
                colSpan={2}
                className="py-2 px-3 text-center border-r border-slate-200/60 text-slate-700"
              >
                Hiệu suất vận hành
              </th>
              <th scope="col" className="py-2 px-3 text-center">
                Thao tác
              </th>
            </tr>

            {/* Tầng 2: Chi tiết từng cột kèm Sort */}
            <tr className="text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              {/* 1. Tên cơ sở */}
              <th
                scope="col"
                onClick={() => handleSort('facilityName')}
                className="py-2.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-200/60"
              >
                <span className="flex items-center gap-1">
                  Cơ sở lưu kho {renderSortIcon('facilityName')}
                </span>
              </th>

              {/* 2. Tiền thuê kho */}
              <th
                scope="col"
                onClick={() => handleSort('rentalRevenue')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors ${
                  isRentalHighlighted ? 'bg-emerald-100/60 text-emerald-900 font-bold' : ''
                }`}
              >
                <span className="flex items-center justify-end gap-1">
                  Tiền thuê kho {renderSortIcon('rentalRevenue')}
                </span>
              </th>

              {/* 3. Phụ phí & Gia hạn */}
              <th
                scope="col"
                onClick={() => handleSort('surchargesAndRenewals')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors ${
                  isSurchargeHighlighted ? 'bg-indigo-100/60 text-indigo-900 font-bold' : ''
                }`}
              >
                <span className="flex items-center justify-end gap-1">
                  Phụ phí & Gia hạn {renderSortIcon('surchargesAndRenewals')}
                </span>
              </th>

              {/* 4. Phí quá hạn */}
              <th
                scope="col"
                onClick={() => handleSort('overdueFeeRevenue')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors ${
                  isOverdueHighlighted ? 'bg-rose-100/60 text-rose-900 font-bold' : ''
                }`}
              >
                <span className="flex items-center justify-end gap-1">
                  Phí quá hạn {renderSortIcon('overdueFeeRevenue')}
                </span>
              </th>

              {/* 5. Tổng thực thu */}
              <th
                scope="col"
                onClick={() => handleSort('totalRevenue')}
                className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors border-r border-slate-200/60 bg-slate-50/80"
              >
                <span className="flex items-center justify-end gap-1">
                  Tổng thực thu {renderSortIcon('totalRevenue')}
                </span>
              </th>

              {/* 6. Tỷ lệ lấp đầy */}
              <th
                scope="col"
                onClick={() => handleSort('occupancyRate')}
                className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  Tỷ lệ lấp đầy {renderSortIcon('occupancyRate')}
                </span>
              </th>

              {/* 7. Ô trống / Tổng */}
              <th
                scope="col"
                className="py-2.5 px-3 text-center border-r border-slate-200/60 font-semibold text-slate-600"
              >
                Ô trống / Khai thác
              </th>

              {/* 8. Thao tác */}
              <th scope="col" className="py-2.5 px-3 text-center font-semibold text-slate-600">
                Chi tiết
              </th>
            </tr>
          </thead>

          {/* THÂN BẢNG (TBODY) */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                  Không tìm thấy cơ sở nào phù hợp với từ khóa &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const exploitableUnits = exploitableOf(row);
                const rateUnknown = exploitableUnits === 0;

                return (
                  <tr
                    key={row.facilityId}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Cột 1: Thông tin cơ sở (Clickable link để lọc toàn trang) */}
                    <td className="py-3 px-4 border-r border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-slate-400 group-hover:text-brand-600 shrink-0 transition-colors" />
                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectFacility && onSelectFacility(row.facilityId)}
                            className="font-bold text-slate-900 group-hover:text-brand-600 hover:underline text-left cursor-pointer transition-colors flex items-center gap-1"
                            title="Click để lọc toàn bộ báo cáo Dashboard theo cơ sở này"
                          >
                            <span>{row.facilityName}</span>
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-brand-500 transition-opacity" />
                          </button>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Mã cơ sở: #{row.facilityId}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Tiền thuê kho */}
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums font-medium text-slate-800 ${
                        isRentalHighlighted ? 'bg-emerald-50/60 font-bold text-emerald-950' : ''
                      }`}
                    >
                      {formatMoneyOrDash(row.rentalRevenue)}
                    </td>

                    {/* Cột 3: Phụ phí & Gia hạn */}
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums text-slate-700 ${
                        isSurchargeHighlighted ? 'bg-indigo-50/60 font-bold text-indigo-950' : ''
                      }`}
                    >
                      {formatMoneyOrDash(row.surchargeRevenue + row.renewalRevenue)}
                    </td>

                    {/* Cột 4: Phí quá hạn */}
                    <td
                      className={`py-3 px-3 text-right font-mono tabular-nums ${
                        isOverdueHighlighted ? 'bg-rose-50/60 font-bold' : ''
                      }`}
                    >
                      {row.overdueFeeRevenue > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          {formatCurrency(row.overdueFeeRevenue)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Cột 5: Tổng thực thu */}
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 text-sm border-r border-slate-100 bg-slate-50/30">
                      {formatCurrency(row.totalRevenue)}
                    </td>

                    {/* Cột 6: Tỷ lệ lấp đầy */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-semibold text-[11px] border ${
                          rateUnknown
                            ? 'bg-slate-50 text-slate-500 border-slate-200'
                            : row.occupancyRate >= 0.8
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : row.occupancyRate >= 0.5
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {rateUnknown ? 'N/A' : formatPercent(row.occupancyRate)}
                      </span>
                    </td>

                    {/* Cột 7: Ô trống / Tổng */}
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 border-r border-slate-100">
                      {exploitableUnits === 0 ? (
                        <span className="text-slate-400">N/A</span>
                      ) : (
                        <>
                          <span className="text-emerald-600 font-semibold">
                            {row.availableUnits}
                          </span>
                          <span className="text-slate-400"> / </span>
                          <span>{exploitableUnits} ô</span>
                        </>
                      )}
                    </td>

                    {/* Cột 8: Nút Xem chi tiết (Mở Drawer) */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenDetail && onOpenDetail(row)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-600 hover:text-brand-700 bg-slate-100 hover:bg-brand-50 transition-all border border-slate-200/80 cursor-pointer shadow-2xs"
                        title="Xem nhanh bóc tách nguồn thu & ô kho trong Drawer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* DÒNG TỔNG CỘNG TOÀN HỆ THỐNG (STICKY FOOTER NỔI BẬT) */}
          <tfoot className="sticky bottom-0 z-20 bg-slate-100/95 font-bold border-t-2 border-slate-400 text-slate-900 shadow-lg backdrop-blur-xs">
            <tr>
              <td className="py-3 px-4 text-xs uppercase tracking-wide border-r border-slate-300">
                <div className="flex items-center gap-2">
                  <span>TỔNG CỘNG TOÀN HỆ THỐNG</span>
                  <span className="text-[10px] font-mono font-normal text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                    {allRows.length} cơ sở
                  </span>
                </div>
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900">
                {formatCurrency(totalRental)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900">
                {formatCurrency(totalSurchargesAndRenewals)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-rose-600">
                {formatCurrency(totalOverdueFees)}
              </td>
              <td className="py-3 px-3 text-right font-mono tabular-nums text-brand-600 text-sm border-r border-slate-300">
                {formatCurrency(grandTotalRevenue)}
              </td>
              <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-900">
                {averageOccupancy == null ? 'N/A' : formatPercent(averageOccupancy)}
              </td>
              <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-900 border-r border-slate-300">
                {totalExploitable === 0
                  ? 'N/A'
                  : `${totalAvailable} trống / ${totalExploitable} ô`}
              </td>
              <td className="py-3 px-3 text-center text-slate-400 text-[11px]">
                Toàn quốc
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
