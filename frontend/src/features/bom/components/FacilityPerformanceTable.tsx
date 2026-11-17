import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronRight,
} from 'lucide-react';
import type { FacilityRevenueBreakdown, FacilityOccupancyItem } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/format';
import { TablePagination } from '@/components/ui/TablePagination';
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

function formatMoneyOrDash(value: number): React.ReactNode {
  if (value === 0) {
    return <span className="text-gray-400 font-normal">-</span>;
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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, sortField, sortDirection, pageSize]);

  const money = (value: number | undefined | null) =>
    Number.isFinite(Number(value)) ? Number(value) : 0;

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

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return allRows;
    const term = searchTerm.toLowerCase().trim();
    return allRows.filter(
      (r) =>
        r.facilityName.toLowerCase().includes(term) ||
        String(r.facilityId).includes(term)
    );
  }, [allRows, searchTerm]);

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
          aVal = a.occupancyRate ?? -1;
          bVal = b.occupancyRate ?? -1;
          break;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
  }, [filteredRows, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = useMemo(
    () => sortedRows.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [sortedRows, safePage, pageSize]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-500 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-brand-600 ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-brand-600 ml-1 inline" />
    );
  };

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

  const isRentalHighlighted = highlightedStream === 'rental';
  const isSurchargeHighlighted = highlightedStream === 'surcharge' || highlightedStream === 'renewal';
  const isOverdueHighlighted = highlightedStream === 'overdue';
  const isAnyStreamHighlighted = highlightedStream !== null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-5 animate-pulse space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-100 rounded-md" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
      {/* Header & Search */}
      <div className="px-4 py-3.5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Doanh Thu &amp; Hiệu Quả Từng Cơ Sở
          </h3>
          {isAnyStreamHighlighted && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 text-xs font-medium">
              <span>Lọc chéo cột: <strong>{highlightedStream}</strong></span>
              <button
                type="button"
                onClick={onClearHighlight}
                className="hover:text-brand-900 ml-0.5 cursor-pointer"
                title="Bỏ lọc chéo cột"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm tên hoặc mã cơ sở..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50/70 border border-gray-200 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[540px]">
        <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200">
            <tr className="text-gray-600 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">
              <th
                scope="col"
                onClick={() => handleSort('facilityName')}
                className="w-[24%] py-2.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-1">
                  Cơ sở lưu kho {renderSortIcon('facilityName')}
                </span>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('rentalRevenue')}
                className={`w-[13%] py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition-colors ${
                  isRentalHighlighted ? 'bg-emerald-100/60 text-emerald-900' : ''
                }`}
              >
                <span className="flex items-center justify-end gap-1">
                  Tiền thuê kho {renderSortIcon('rentalRevenue')}
                </span>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('surchargesAndRenewals')}
                className={`w-[13%] py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition-colors ${
                  isSurchargeHighlighted ? 'bg-brand-100/60 text-brand-900' : ''
                }`}
              >
                <span className="flex items-center justify-end gap-1">
                  Gia hạn &amp; Phụ phí {renderSortIcon('surchargesAndRenewals')}
                </span>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('overdueFeeRevenue')}
                className={`w-[11%] py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition-colors ${
                  isOverdueHighlighted ? 'bg-rose-100/60 text-rose-900' : ''
                }`}
              >
                <span className="flex items-center justify-end gap-1">
                  Phí quá hạn {renderSortIcon('overdueFeeRevenue')}
                </span>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('totalRevenue')}
                className="w-[14%] py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center justify-end gap-1">
                  Tổng thực thu {renderSortIcon('totalRevenue')}
                </span>
              </th>

              <th
                scope="col"
                onClick={() => handleSort('occupancyRate')}
                className="w-[14%] py-2.5 px-3 text-right cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center justify-end gap-1">
                  Tỷ lệ lấp đầy {renderSortIcon('occupancyRate')}
                </span>
              </th>

              <th scope="col" className="w-[8%] py-2.5 px-3 text-right font-bold text-gray-600">
                Ô trống / Khai thác
              </th>

              <th scope="col" className="w-[4%] py-2.5 px-3 text-right font-bold text-gray-600">
                <span className="sr-only">Chi tiết</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400 italic">
                  Không tìm thấy cơ sở nào phù hợp với từ khóa &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => {
                const exploitableUnits = exploitableOf(row);
                const rateUnknown = row.occupancyRate == null || exploitableUnits === 0;
                const pct = rateUnknown ? 0 : Math.min(Math.max((row.occupancyRate ?? 0) * 100, 0), 100);

                return (
                  <tr key={row.facilityId} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => onSelectFacility && onSelectFacility(row.facilityId)}
                          className="font-semibold text-gray-900 group-hover:text-brand-600 hover:underline text-left cursor-pointer transition-colors"
                          title="Click để lọc toàn bộ báo cáo Dashboard theo cơ sở này"
                        >
                          {row.facilityName}
                        </button>
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          ID: #{row.facilityId}
                        </span>
                      </div>
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right tabular-nums font-medium text-gray-800 ${
                        isRentalHighlighted ? 'bg-emerald-50/60 font-bold text-emerald-950' : ''
                      }`}
                    >
                      {formatMoneyOrDash(row.rentalRevenue)}
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right tabular-nums text-gray-700 ${
                        isSurchargeHighlighted ? 'bg-brand-50/60 font-bold text-brand-950' : ''
                      }`}
                    >
                      {formatMoneyOrDash(row.surchargeRevenue + row.renewalRevenue)}
                    </td>

                    <td
                      className={`py-2.5 px-3 text-right tabular-nums ${
                        isOverdueHighlighted ? 'bg-rose-50/60 font-bold' : ''
                      }`}
                    >
                      {row.overdueFeeRevenue > 0 ? (
                        <span className="text-rose-600 font-semibold">
                          {formatCurrency(row.overdueFeeRevenue)}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-gray-900 text-xs bg-gray-50/30">
                      {formatMoneyOrDash(row.totalRevenue)}
                    </td>

                    {/* Progress Bar + Percentage */}
                    <td className="py-2.5 px-3">
                      {rateUnknown ? (
                        <span className="block text-right text-gray-400">N/A</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <div
                            role="progressbar"
                            aria-valuenow={Math.round(pct)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Tỷ lệ lấp đầy ${row.facilityName}`}
                            className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden shrink-0"
                          >
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all ${
                                pct > 0 ? 'bg-brand-600' : 'bg-gray-300'
                              }`}
                            />
                          </div>
                          <span className="tabular-nums font-semibold text-gray-700 w-10 text-right">
                            {formatPercent(row.occupancyRate ?? 0)}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right tabular-nums text-gray-700">
                      {exploitableUnits === 0 ? (
                        <span className="text-gray-400">N/A</span>
                      ) : (
                        <span>
                          {row.availableUnits}/{exploitableUnits}
                        </span>
                      )}
                    </td>

                    {/* Compact > icon button */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetail && onOpenDetail(row)}
                        aria-label="Chi tiết"
                        title="Xem chi tiết cơ sở"
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          <tfoot className="sticky bottom-0 z-10 font-bold border-t-2 border-gray-300 text-gray-900">
            <tr className="bg-gray-100 whitespace-nowrap">
              <td className="bg-gray-100 py-2.5 px-4 text-xs uppercase tracking-wide">
                TỔNG CỘNG TOÀN HỆ THỐNG
              </td>
              <td className="bg-gray-100 py-2.5 px-3 text-right tabular-nums text-gray-900">
                {formatCurrency(totalRental)}
              </td>
              <td className="bg-gray-100 py-2.5 px-3 text-right tabular-nums text-gray-900">
                {formatCurrency(totalSurchargesAndRenewals)}
              </td>
              <td className="bg-gray-100 py-2.5 px-3 text-right tabular-nums text-rose-600">
                {formatCurrency(totalOverdueFees)}
              </td>
              <td className="bg-gray-100 py-2.5 px-3 text-right tabular-nums text-brand-700 text-sm">
                {formatCurrency(grandTotalRevenue)}
              </td>
              <td className="bg-gray-100 py-2.5 px-3 text-right tabular-nums text-xs text-gray-800">
                {averageOccupancy == null ? (
                  <span className="text-gray-400 font-normal">N/A</span>
                ) : (
                  formatPercent(averageOccupancy)
                )}
              </td>
              <td className="bg-gray-100 py-2.5 px-3 text-right tabular-nums text-xs text-gray-700">
                {totalExploitable === 0 ? 'N/A' : `${totalAvailable}/${totalExploitable}`}
              </td>
              <td className="bg-gray-100 py-2.5 px-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 3-Part Enterprise Pagination */}
      {sortedRows.length > pageSize && (
        <TablePagination
          page={safePage}
          pageSize={pageSize}
          totalElements={sortedRows.length}
          totalPages={totalPages}
          itemLabel="cơ sở"
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(0);
          }}
        />
      )}
    </div>
  );
};
