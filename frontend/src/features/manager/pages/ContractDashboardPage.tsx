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
  Layers,
  Plus,
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
import { CreateDirectContractModal } from '../components/CreateDirectContractModal';

const REGION_TABS: { label: string; value: RegionFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Hà Nội', value: 'HN' },
  { label: 'TP.HCM', value: 'HCM' },
  { label: 'Đà Nẵng', value: 'DN' },
  { label: 'Khác', value: 'OTHER' },
];

const DEFAULT_PAGE_SIZE = 12;

export const ContractDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, FacilityContractStats>>({});
  const [allContracts, setAllContracts] = useState<ManagerContractItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionFilter>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDirectContractModal, setShowDirectContractModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleDirectContractSuccess = (_newContract: unknown, message: string) => {
    setToastMessage({ text: message, type: 'success' });
    loadData(true);
    setTimeout(() => setToastMessage(null), 4000);
  };

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
            (c.status as string) === 'INSPECTED' ||
            (c.status as string) === 'CANCELLED' ||
            (c.status as string) === 'TERMINATED'
        ).length;
        const overdue = facContracts.filter((c) => c.status === 'OVERDUE').length;

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

  // Tổng hợp KPI toàn hệ thống
  const globalKpis = useMemo(() => {
    const total = allContracts.length;
    const active = allContracts.filter((c) => c.status === 'ACTIVE').length;
    const overdue = allContracts.filter((c) => c.status === 'OVERDUE').length;
    const pending = allContracts.filter(
      (c) =>
        c.status === 'PENDING_RETURN' ||
        c.status === 'PENDING_CHECK_IN' ||
        (c.status as string) === 'INSPECTED' ||
        (c.status as string) === 'CANCELLED' ||
        (c.status as string) === 'TERMINATED'
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

  // Phân trang
  const totalPages = Math.ceil(filteredFacilities.length / pageSize) || 1;
  const paginatedFacilities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredFacilities.slice(startIndex, startIndex + pageSize);
  }, [filteredFacilities, currentPage, pageSize]);

  return (
    <div className="space-y-5 pb-12">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Giám sát hợp đồng — Danh sách Cơ sở
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Chọn cơ sở để theo dõi danh sách hợp đồng thuê, công nợ quá hạn và thủ tục nghiệm thu thanh lý
          </p>
        </div>

        {/* Toolbar: Tìm kiếm cơ sở, làm mới & Tạo HĐ trực tiếp */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px] flex-1 md:flex-initial">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm cơ sở..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setShowDirectContractModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo HĐ trực tiếp</span>
          </button>
        </div>
      </div>

      {/* Thanh Tổng quan toàn hệ thống (Nền trắng, viền xám, chấm tròn ngữ nghĩa) */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-5 h-5 text-gray-400 shrink-0" />
          <div className="flex flex-wrap items-baseline gap-2">
            <h2 className="text-sm font-bold text-gray-900">Tổng quan toàn hệ thống</h2>
            <span className="text-xs text-gray-500">
              ({facilities.length} cơ sở được phân công quản lý)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Tổng HĐ:</span>
            <span className="font-bold text-gray-900 tabular-nums">{globalKpis.total}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-gray-500">Đang hiệu lực:</span>
            <span className="font-bold text-gray-900 tabular-nums">{globalKpis.active}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-gray-500">Quá hạn:</span>
            <span
              className={`font-bold tabular-nums ${
                globalKpis.overdue > 0 ? 'text-rose-600' : 'text-gray-900'
              }`}
            >
              {globalKpis.overdue}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pl-4 border-l border-gray-200">
            <span className="text-gray-500">Cơ sở:</span>
            <span className="font-bold text-gray-900 tabular-nums">{facilities.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Khu vực */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto">
          {REGION_TABS.map((tab) => {
            const isActive = selectedRegion === tab.value;
            const count = regionCounts[tab.value] || 0;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedRegion(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                    isActive ? 'bg-brand-100 text-brand-800' : 'bg-gray-200/80 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => loadData(true)} className="font-bold underline cursor-pointer">
            Thử lại
          </button>
        </div>
      )}

      {/* Danh sách nén (Compact List) Cơ sở & Số liệu Hợp đồng */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-50/60 animate-pulse" />
          ))}
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800">Không tìm thấy cơ sở nào</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedRegion !== 'ALL'
              ? 'Không có cơ sở nào phù hợp với bộ lọc và từ khóa tìm kiếm.'
              : 'Bạn chưa được phân công quản lý cơ sở nào trong hệ thống.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
            {/* Dòng tiêu đề bảng */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-4">Cơ sở lưu kho</div>
              <div className="col-span-4">Địa chỉ</div>
              <div className="col-span-3 text-center">Hợp đồng (Active / Quá hạn)</div>
              <div className="col-span-1" />
            </div>

            {/* Các dòng cơ sở */}
            <div className="divide-y divide-gray-100">
              {paginatedFacilities.map((facility) => (
                <FacilityContractSummaryCard
                  key={facility.id}
                  facility={facility}
                  stats={statsMap[facility.id]}
                  onClick={() => navigate(`/manager/contracts/facilities/${facility.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Phân trang */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFacilities.length}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24, 48]}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            showAlways={true}
            itemName="cơ sở"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 ${
            toastMessage.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Direct Contract Creation Modal */}
      <CreateDirectContractModal
        isOpen={showDirectContractModal}
        onClose={() => setShowDirectContractModal(false)}
        onSuccess={handleDirectContractSuccess}
      />
    </div>
  );
};
