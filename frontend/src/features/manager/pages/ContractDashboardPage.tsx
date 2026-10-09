// frontend/src/features/manager/pages/ContractDashboardPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getManagerContracts } from '@/api/contract';
import type { FacilityListItem } from '@/types';
import type { ManagerContractItem } from '@/types/contractManager';
import {
  FacilityContractSummaryCard,
  type FacilityContractStats,
} from '../components/FacilityContractSummaryCard';
import { Pagination } from '../components/Pagination';
import { getFacilityRegion, type RegionFilter } from './FacilityListPage';

const REGION_TABS: { label: string; value: RegionFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Hà Nội', value: 'HN' },
  { label: 'TP.HCM', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Khác', value: 'OTHER' },
];

const PAGE_SIZE = 12;

export const ContractDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, FacilityContractStats>>({});
  const [allContracts, setAllContracts] = useState<ManagerContractItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Tải danh sách cơ sở phân công cho FM
      const facList = await fetchMyAssignedFacilities();
      setFacilities(facList);

      // 2. Tải toàn bộ hợp đồng thuộc các cơ sở này
      const contractsRes = await getManagerContracts({ status: 'ALL' });
      const contracts = contractsRes || [];
      setAllContracts(contracts);

      // 3. Tính toán stats hợp đồng cho từng cơ sở
      const newStatsMap: Record<number, FacilityContractStats> = {};
      facList.forEach((fac) => {
        const facContracts = contracts.filter((c) => c.facilityId === fac.id);
        const total = facContracts.length;
        const active = facContracts.filter((c) => c.status === 'ACTIVE').length;
        const pending = facContracts.filter(
          (c) =>
            c.status === 'PENDING_RETURN' ||
            c.status === 'PENDING_CHECK_IN' ||
            (c.status as string) === 'INSPECTED'
        ).length;
        const overdue = facContracts.filter(
          (c) => c.status === 'OVERDUE' || c.status === 'TERMINATED'
        ).length;

        newStatsMap[fac.id] = { total, active, pending, overdue };
      });
      setStatsMap(newStatsMap);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu hợp đồng:', err);
      setError('Không thể tải dữ liệu giám sát hợp đồng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reset về trang 1 khi tìm kiếm hoặc đổi khu vực
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRegion]);

  // Tổng hợp KPI toàn hệ thống
  const globalKpis = useMemo(() => {
    const total = allContracts.length;
    const active = allContracts.filter((c) => c.status === 'ACTIVE').length;
    const overdue = allContracts.filter(
      (c) => c.status === 'OVERDUE' || c.status === 'TERMINATED'
    ).length;
    const pending = allContracts.filter(
      (c) =>
        c.status === 'PENDING_RETURN' ||
        c.status === 'PENDING_CHECK_IN' ||
        (c.status as string) === 'INSPECTED'
    ).length;
    return { total, active, overdue, pending };
  }, [allContracts]);

  // Đếm số lượng cơ sở theo từng tab khu vực
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

  // Lọc cơ sở theo khu vực & từ khóa tìm kiếm
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      if (selectedRegion !== 'ALL' && getFacilityRegion(f) !== selectedRegion) {
        return false;
      }
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        f.name.toLowerCase().includes(term) ||
        f.code.toLowerCase().includes(term) ||
        (f.address && f.address.toLowerCase().includes(term))
      );
    });
  }, [facilities, selectedRegion, searchTerm]);

  // Phân trang: 12 cards/trang
  const totalPages = Math.ceil(filteredFacilities.length / PAGE_SIZE) || 1;
  const paginatedFacilities = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredFacilities.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFacilities, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Giám sát hợp đồng — Tổng quan theo Cơ sở (Cấp 1)
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              FM-02
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn cơ sở để theo dõi danh sách hợp đồng thuê, công nợ quá hạn và thủ tục nghiệm thu thanh lý
          </p>
        </div>

        {/* Toolbar: Tìm kiếm cơ sở & Nút làm mới */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm cơ sở..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Banner Tổng hợp trên đầu trang */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Tổng quan toàn hệ thống</h2>
            <p className="text-xs text-slate-400">
              {facilities.length} cơ sở được phân công quản lý
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl">
            <span className="text-slate-300">Tổng:</span>
            <span className="font-mono font-bold text-white text-sm">
              {globalKpis.total} HĐ
            </span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active:</span>
            <span className="font-mono font-bold text-white text-sm">
              {globalKpis.active}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-xl border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Quá hạn:</span>
            <span className="font-mono font-bold text-white text-sm">
              {globalKpis.overdue}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Khu vực */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto w-fit">
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

      {/* Grid 3 cột Danh sách Cơ sở: Desktop >=1280px 3 cột, Tablet 768-1279px 2 cột, Mobile 1 cột */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/80" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedRegion !== 'ALL'
              ? 'Không có cơ sở nào phù hợp với bộ lọc và từ khóa tìm kiếm.'
              : 'Bạn chưa được phân công quản lý cơ sở nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {paginatedFacilities.map((facility) => (
              <FacilityContractSummaryCard
                key={facility.id}
                facility={facility}
                stats={statsMap[facility.id]}
                onClick={() => navigate(`/manager/contracts/facilities/${facility.id}`)}
              />
            ))}
          </div>

          {/* Phân trang: 12 cards/trang, threshold > 12 */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFacilities.length}
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
