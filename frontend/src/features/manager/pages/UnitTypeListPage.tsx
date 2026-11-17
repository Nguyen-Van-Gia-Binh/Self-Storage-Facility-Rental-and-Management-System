// frontend/src/features/manager/pages/UnitTypeListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  AlertCircle,
  Box,
  Snowflake,
  Building2,
  ArrowUpDown,
  LayoutGrid,
  Table2,
  ChevronRight,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchUnitTypes, fetchStorageUnits } from '@/api/unit';
import type { FacilityListItem } from '@/types';
import type { UnitTypeResponse } from '@/types/unit';
import { Breadcrumb } from '../components/Breadcrumb';
import { UnitTypeCard, cleanUnitTypeName, isClimateType } from '../components/UnitTypeCard';
import type { UnitTypeBreakdownStats } from '../components/UnitTypeCard';
import { Pagination } from '../components/Pagination';

export type UnitTypeSortOption =
  | 'name-asc'
  | 'name-desc'
  | 'units-desc'
  | 'units-asc';

const SORT_OPTIONS: { label: string; value: UnitTypeSortOption }[] = [
  { label: 'Tên loại (A → Z)', value: 'name-asc' },
  { label: 'Tên loại (Z → A)', value: 'name-desc' },
  { label: 'Quy mô số ô (Nhiều nhất)', value: 'units-desc' },
  { label: 'Quy mô số ô (Ít nhất)', value: 'units-asc' },
];

const PAGE_SIZE = 12;

export const UnitTypeListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();

  const facilityIdNum = Number(facilityId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [unitTypes, setUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [typeStatsMap, setTypeStatsMap] = useState<Record<number, UnitTypeBreakdownStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<UnitTypeSortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInactive, setShowInactive] = useState(false);
  // Mặc định mở dạng Bảng (ERP/WMS) giúp FM quét nhanh và so sánh thông số
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (isManual = false) => {
      if (!facilityIdNum) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const facList = await fetchMyAssignedFacilities();
        const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
        setFacility(currentFac);

        const utRes = await fetchUnitTypes(facilityIdNum, { size: 100 });
        const types = utRes?.content || [];
        setUnitTypes(types);

        const suRes = await fetchStorageUnits(facilityIdNum, {
          size: 500,
        });
        const units = suRes?.content || [];

        const statsMap: Record<number, UnitTypeBreakdownStats> = {};
        types.forEach((t) => {
          const matchingUnits = units.filter((u) => u.unitTypeId === t.id);
          statsMap[t.id] = {
            total: matchingUnits.length,
            available: matchingUnits.filter((u) => u.status === 'AVAILABLE').length,
            occupied: matchingUnits.filter((u) => u.status === 'OCCUPIED').length,
            maintenance: matchingUnits.filter((u) => u.status === 'MAINTENANCE').length,
          };
        });
        setTypeStatsMap(statsMap);
      } catch (err) {
        console.error('Lỗi tải danh mục loại kho:', err);
        setError('Không thể tải danh sách loại ô kho của cơ sở.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [facilityIdNum]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy, showInactive]);

  const isTypeActive = (t: UnitTypeResponse) => t.isActive ?? t.active ?? true;

  const processedTypes = useMemo(() => {
    const filtered = unitTypes
      .filter((t) => (showInactive ? true : isTypeActive(t)))
      .filter((t) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          t.name.toLowerCase().includes(term) ||
          (t.code && t.code.toLowerCase().includes(term)) ||
          (t.description && t.description.toLowerCase().includes(term))
        );
      });

    return filtered.sort((a, b) => {
      const statsA = typeStatsMap[a.id];
      const statsB = typeStatsMap[b.id];
      const totalA = statsA ? statsA.total : (a.totalUnits ?? 0);
      const totalB = statsB ? statsB.total : (b.totalUnits ?? 0);

      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'vi');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'vi');
        case 'units-desc':
          return totalB - totalA;
        case 'units-asc':
          return totalA - totalB;
        default:
          return 0;
      }
    });
  }, [unitTypes, showInactive, typeStatsMap, searchTerm, sortBy]);

  const totalPages = Math.ceil(processedTypes.length / PAGE_SIZE) || 1;
  const paginatedTypes = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return processedTypes.slice(startIndex, startIndex + PAGE_SIZE);
  }, [processedTypes, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb cấp 2 */}
      <Breadcrumb
        items={[
          {
            label: facility?.name || `Cơ sở #${facilityIdNum}`,
            icon: Building2,
          },
        ]}
      />

      {/* Page Header phẳng chuẩn Enterprise SaaS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Danh sách Loại ô kho
            </h1>
            <span className="text-sm text-gray-500 tabular-nums">
              · {processedTypes.length} loại
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {facility ? `${facility.name} (${facility.code})` : `Cơ sở #${facilityIdNum}`} · Danh mục chuẩn (chỉ đọc) — chọn một loại kho để quản lý các ô vật lý.
          </p>
        </div>

        {/* Actions & View Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên, mã loại kho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer select-none px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-3.5 h-3.5 accent-brand-600 rounded cursor-pointer"
            />
            <span>Hiện loại vô hiệu</span>
          </label>

          {/* Sort Dropdown */}
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as UnitTypeSortOption)}
              aria-label="Sắp xếp loại ô kho"
              className="bg-transparent text-xs font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Mode Switcher: Bảng | Lưới */}
          <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Xem dạng Bảng"
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Xem dạng Lưới"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lưới</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
            aria-label="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => loadData(true)}
            className="font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Danh sách Loại ô kho: Bảng chuẩn ERP/WMS (Mặc định) hoặc Lưới thẻ phẳng */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : processedTypes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Box className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Không tìm thấy loại ô kho nào</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Không có loại ô kho nào phù hợp với từ khóa tìm kiếm.'
              : 'Cơ sở này hiện chưa được cấu hình loại ô kho nào.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'table' ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Tên loại kho</th>
                      <th className="py-3 px-4">Mã</th>
                      <th className="py-3 px-4">Phân loại</th>
                      <th className="py-3 px-4 text-right">Diện tích</th>
                      <th className="py-3 px-4 text-right">Kích thước</th>
                      <th className="py-3 px-4 text-right">Quy mô</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedTypes.map((type) => {
                      const isClimate = isClimateType(type);
                      const Icon = isClimate ? Snowflake : Box;
                      const active = isTypeActive(type);
                      const stats = typeStatsMap[type.id];
                      const totalUnits = stats ? stats.total : (type.totalUnits ?? 0);
                      const availableUnits = stats ? stats.available : 0;
                      const area =
                        type.areaM2 ||
                        (type.widthM && type.depthM
                          ? Number((type.widthM * type.depthM).toFixed(1))
                          : 0);
                      const dimensionsText =
                        type.widthM && type.depthM && type.heightM
                          ? `${type.widthM}×${type.depthM}×${type.heightM}m`
                          : '—';

                      return (
                        <tr
                          key={type.id}
                          onClick={() =>
                            navigate(`/manager/facilities/${facilityIdNum}/unit-types/${type.id}`)
                          }
                          className="hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
                              <span className="font-semibold text-gray-900 group-hover:text-brand-700 transition-colors">
                                {cleanUnitTypeName(type.name)}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                            {type.code || 'UT-STD'}
                          </td>

                          <td className="py-3.5 px-4 text-gray-600">
                            {isClimate ? 'Máy lạnh' : 'Tiêu chuẩn'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-semibold text-gray-900 tabular-nums">
                            {area} m²
                          </td>

                          <td className="py-3.5 px-4 text-right text-gray-600 tabular-nums whitespace-nowrap">
                            {dimensionsText}
                          </td>

                          <td className="py-3.5 px-4 text-right font-medium text-gray-700 tabular-nums">
                            {totalUnits} ô
                          </td>

                          <td className="py-3.5 px-4">
                            {!active ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Vô hiệu
                              </span>
                            ) : availableUnits > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 tabular-nums">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Còn {availableUnits} ô trống
                              </span>
                            ) : totalUnits > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Hết ô
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                Chưa có ô
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/manager/facilities/${facilityIdNum}/unit-types/${type.id}`
                                );
                              }}
                              className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                            >
                              <span>Xem chi tiết</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginatedTypes.map((type) => (
                <UnitTypeCard
                  key={type.id}
                  type={type}
                  stats={typeStatsMap[type.id]}
                  onClick={() =>
                    navigate(`/manager/facilities/${facilityIdNum}/unit-types/${type.id}`)
                  }
                />
              ))}
            </div>
          )}

          {/* Phân trang: Threshold > 12 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedTypes.length}
            pageSize={PAGE_SIZE}
            threshold={12}
            itemName="loại kho"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};
