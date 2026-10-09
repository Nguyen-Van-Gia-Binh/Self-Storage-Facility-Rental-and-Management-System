// frontend/src/features/manager/pages/FacilityListPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, RefreshCw, AlertCircle, Layers, ArrowUpDown } from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchStorageUnits } from '@/api/unit';
import type { FacilityListItem } from '@/types';
import { FacilityCard } from '../components/FacilityCard';
import type { FacilityStats } from '../components/FacilityCard';
import { Pagination } from '../components/Pagination';

export type RegionFilter = 'ALL' | 'HN' | 'HCM' | 'DN' | 'OTHER';

const REGION_TABS: { label: string; value: RegionFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Hà Nội', value: 'HN' },
  { label: 'TP.HCM', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Khác', value: 'OTHER' },
];

export type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'occupancy-desc'
  | 'occupancy-asc'
  | 'units-desc'
  | 'units-asc';

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Tên cơ sở (A → Z)', value: 'name-asc' },
  { label: 'Tên cơ sở (Z → A)', value: 'name-desc' },
  { label: 'Tỷ lệ lấp đầy (Cao → Thấp)', value: 'occupancy-desc' },
  { label: 'Tỷ lệ lấp đầy (Thấp → Cao)', value: 'occupancy-asc' },
  { label: 'Tổng số ô kho (Nhiều → Ít)', value: 'units-desc' },
  { label: 'Tổng số ô kho (Ít → Nhiều)', value: 'units-asc' },
];

export const getFacilityRegion = (facility: { address?: string; name: string }): RegionFilter => {
  const text = `${facility.address || ''} ${facility.name}`.toLowerCase();
  if (
    text.includes('hà nội') ||
    text.includes('ha noi') ||
    text.includes('cầu giấy') ||
    text.includes('đống đa') ||
    text.includes('hoàn kiếm') ||
    text.includes('hai bà trưng') ||
    text.includes('hbt') ||
    text.includes('hoàng mai')
  ) {
    return 'HN';
  }
  if (
    text.includes('hồ chí minh') ||
    text.includes('tp.hcm') ||
    text.includes('tphcm') ||
    text.includes('hcm') ||
    text.includes('sài gòn') ||
    text.includes('quận') ||
    text.includes('thủ đức')
  ) {
    return 'HCM';
  }
  if (
    text.includes('đà nẵng') ||
    text.includes('da nang') ||
    text.includes('hải châu') ||
    text.includes('sơn trà')
  ) {
    return 'DN';
  }
  return 'OTHER';
};

const PAGE_SIZE = 12;

export const FacilityListPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, FacilityStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const list = await fetchMyAssignedFacilities();
      setFacilities(list);

      // Tải song song thống kê ô kho cho từng cơ sở
      const statsPromises = list.map(async (fac) => {
        try {
          const res = await fetchStorageUnits(fac.id, { size: 200 });
          const units = res?.content || [];
          const totalUnits = units.length;
          const occupiedUnits = units.filter((u) => u.status === 'OCCUPIED').length;
          const availableUnits = units.filter((u) => u.status === 'AVAILABLE').length;
          const maintenanceUnits = units.filter((u) => u.status === 'MAINTENANCE').length;
          const exploitable = totalUnits - units.filter((u) => u.status === 'OUT_OF_SERVICE').length;
          const occupancyRate = exploitable > 0 ? (occupiedUnits / exploitable) * 100 : 0;

          return {
            id: fac.id,
            stats: {
              totalUnits,
              occupiedUnits,
              availableUnits,
              maintenanceUnits,
              occupancyRate,
            },
          };
        } catch {
          return {
            id: fac.id,
            stats: {
              totalUnits: 0,
              occupiedUnits: 0,
              availableUnits: 0,
              maintenanceUnits: 0,
              occupancyRate: 0,
            },
          };
        }
      });

      const statsResults = await Promise.all(statsPromises);
      const newStatsMap: Record<number, FacilityStats> = {};
      statsResults.forEach(({ id, stats }) => {
        newStatsMap[id] = stats;
      });
      setStatsMap(newStatsMap);
    } catch (err) {
      console.error('Lỗi khi tải danh sách cơ sở:', err);
      setError('Không thể tải danh sách cơ sở phân công.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset về trang 1 khi đổi bộ lọc hoặc từ khóa
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion, sortBy]);

  // Đếm số lượng cơ sở theo từng khu vực
  const regionCounts = useMemo(() => {
    const counts: Record<RegionFilter, number> = {
      ALL: facilities.length,
      HN: 0,
      HCM: 0,
      DN: 0,
      OTHER: 0,
    };
    facilities.forEach((f) => {
      const region = getFacilityRegion(f);
      counts[region] = (counts[region] || 0) + 1;
    });
    return counts;
  }, [facilities]);

  // Lọc và sắp xếp dữ liệu
  const processedFacilities = useMemo(() => {
    // 1. Search + Filter
    const filtered = facilities.filter((f) => {
      // Filter khu vực
      if (selectedRegion !== 'ALL' && getFacilityRegion(f) !== selectedRegion) {
        return false;
      }
      // Search term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(term) ||
        f.code.toLowerCase().includes(term) ||
        (f.address && f.address.toLowerCase().includes(term))
      );
    });

    // 2. Sort
    return filtered.sort((a, b) => {
      const statsA = statsMap[a.id];
      const statsB = statsMap[b.id];

      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'vi');
        case 'name-desc':
          return b.name.localeCompare(a.name, 'vi');
        case 'occupancy-desc':
          return (statsB?.occupancyRate || 0) - (statsA?.occupancyRate || 0);
        case 'occupancy-asc':
          return (statsA?.occupancyRate || 0) - (statsB?.occupancyRate || 0);
        case 'units-desc':
          return (statsB?.totalUnits || 0) - (statsA?.totalUnits || 0);
        case 'units-asc':
          return (statsA?.totalUnits || 0) - (statsB?.totalUnits || 0);
        default:
          return 0;
      }
    });
  }, [facilities, selectedRegion, searchTerm, sortBy, statsMap]);

  // Phân trang
  const totalPages = Math.ceil(processedFacilities.length / PAGE_SIZE) || 1;
  const paginatedFacilities = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return processedFacilities.slice(startIndex, startIndex + PAGE_SIZE);
  }, [processedFacilities, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản lý ô kho — Chọn Cơ sở (Cấp 1)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              FM-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn cơ sở cần quản lý để bắt đầu xem danh mục loại ô kho và ô kho vật lý (Mô hình Drill-down)
          </p>
        </div>

        {/* Toolbar: Tìm kiếm & Làm mới */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, địa chỉ hoặc mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs Khu vực & Dropdown Sắp xếp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Region Tabs: [Tất cả] [Hà Nội] [TP.HCM] [Đà Nẵng] [Khác] */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          {REGION_TABS.map((tab) => {
            const isActive = selectedRegion === tab.value;
            const count = regionCounts[tab.value] || 0;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedRegion(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-600 self-end sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-500 whitespace-nowrap">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer shadow-2xs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => loadData(true)} className="font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* Facility Grid Area: Desktop >=1280px 3 cột, Tablet 768-1279px 2 cột, Mobile 1 cột */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/80" />
          ))}
        </div>
      ) : processedFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedRegion !== 'ALL'
              ? 'Không có cơ sở nào phù hợp với bộ lọc và từ khóa tìm kiếm. Vui lòng thử lại.'
              : 'Bạn chưa được phân công quản lý cơ sở nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedFacilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                stats={statsMap[facility.id]}
                onClick={() => navigate(`/manager/facilities/${facility.id}`)}
              />
            ))}
          </div>

          {/* Phân trang: Threshold > 12 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedFacilities.length}
            pageSize={PAGE_SIZE}
            threshold={12}
            itemName="cơ sở"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};
