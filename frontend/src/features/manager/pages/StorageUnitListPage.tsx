// frontend/src/features/manager/pages/StorageUnitListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Building2,
  Layers,
  Filter,
  CheckCircle2,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import {
  fetchUnitTypes,
  fetchStorageUnits,
  createStorageUnit,
  updateStorageUnitStatus,
} from '@/api/unit';
import { getManagerContracts } from '@/api/contract';
import type { FacilityListItem } from '@/types';
import type {
  StorageUnitResponse,
  UnitTypeResponse,
  StorageUnitFormData,
  UnitStatus,
} from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { StorageUnitTable } from '../components/StorageUnitTable';
import type { StorageUnitSortField, SortDirection } from '../components/StorageUnitTable';
import { StorageUnitFormModal } from '../components/StorageUnitFormModal';
import { Pagination } from '../components/Pagination';

const STATUS_FILTERS: { label: string; value: UnitStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Trống', value: 'AVAILABLE' },
  { label: 'Đang thuê', value: 'OCCUPIED' },
  { label: 'Bảo trì', value: 'MAINTENANCE' },
];

const PAGE_SIZE = 10;

export const StorageUnitListPage: React.FC = () => {
  const { facilityId, typeId } = useParams<{ facilityId: string; typeId: string }>();
  const navigate = useNavigate();
  const facilityIdNum = Number(facilityId) || 0;
  const typeIdNum = Number(typeId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [unitType, setUnitType] = useState<UnitTypeResponse | null>(null);
  const [storageUnits, setStorageUnits] = useState<StorageUnitResponse[]>([]);
  const [contractsMap, setContractsMap] = useState<Record<number, ManagerContractItem>>({});
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sắp xếp cột bảng
  const [sortField, setSortField] = useState<StorageUnitSortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal thêm ô kho
  const [suModalOpen, setSuModalOpen] = useState(false);

  const loadData = useCallback(
    async (isManual = false) => {
      if (!facilityIdNum || !typeIdNum) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // 1. Tải cơ sở & loại kho
        const [facList, utRes, suRes, contractsRes] = await Promise.all([
          fetchMyAssignedFacilities(),
          fetchUnitTypes(facilityIdNum, { size: 100 }),
          fetchStorageUnits(facilityIdNum, { unitTypeId: typeIdNum, size: 200 }),
          getManagerContracts({ facilityId: facilityIdNum, status: 'ALL' }),
        ]);

        const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
        setFacility(currentFac);

        const types = utRes?.content || [];
        const currentType = types.find((t) => t.id === typeIdNum) || null;
        setUnitType(currentType);

        setStorageUnits(suRes?.content || []);

        // Ánh xạ hợp đồng còn hiệu lực với từng ô kho
        const activeContracts = (contractsRes || []).filter(
          (c) =>
            c.status === 'ACTIVE' ||
            c.status === 'OVERDUE' ||
            (c.status as string) === 'PENDING_RETURN' ||
            c.status === 'PENDING_CHECK_IN'
        );
        const cMap: Record<number, ManagerContractItem> = {};
        activeContracts.forEach((c) => {
          if (c.storageUnitId) {
            cMap[c.storageUnitId] = c;
          }
        });
        setContractsMap(cMap);
      } catch (err) {
        console.error('Lỗi khi tải danh sách ô kho:', err);
        setError('Không thể tải dữ liệu danh sách ô kho.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [facilityIdNum, typeIdNum]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset về trang 1 khi đổi bộ lọc hoặc từ khóa
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedFloor, sortField, sortDirection]);

  const handleSubmitUnit = async (data: StorageUnitFormData) => {
    try {
      await createStorageUnit(facilityIdNum, {
        ...data,
        unitTypeId: typeIdNum,
      });
      setSuModalOpen(false);
      await loadData(true);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Tạo ô kho mới thất bại.');
    }
  };

  const handleStatusChange = async (unit: StorageUnitResponse, status: UnitStatus) => {
    try {
      await updateStorageUnitStatus(facilityIdNum, unit.id, status);
      await loadData(true);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại.');
    }
  };

  // Danh sách các tầng xuất hiện trong data
  const availableFloors = useMemo(() => {
    const floors = new Set<number>();
    storageUnits.forEach((u) => {
      floors.add(u.floor ?? 1);
    });
    return Array.from(floors).sort((a, b) => a - b);
  }, [storageUnits]);

  // Tính số lượng cho các tab filter
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: storageUnits.length };
    storageUnits.forEach((u) => {
      counts[u.status] = (counts[u.status] || 0) + 1;
    });
    return counts;
  }, [storageUnits]);

  // Tính toán KPI Tổng quan khoang lưu trữ (Đưa từ cấp ngoài vào cấp trong)
  const statsOverview = useMemo(() => {
    const total = storageUnits.length;
    const available = storageUnits.filter((u) => u.status === 'AVAILABLE').length;
    const occupied = storageUnits.filter((u) => u.status === 'OCCUPIED').length;
    const maintenance = storageUnits.filter((u) => u.status === 'MAINTENANCE').length;
    const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;
    const isFull = total > 0 && occupancyRate >= 100;
    const isNearFull = !isFull && occupancyRate >= 75;

    return {
      total,
      available,
      occupied,
      maintenance,
      occupancyRate,
      isFull,
      isNearFull,
    };
  }, [storageUnits]);

  // Handler khi click sort trên header bảng
  const handleSort = (field: StorageUnitSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Lọc và Sắp xếp
  const processedUnits = useMemo(() => {
    // 1. Filter
    const filtered = storageUnits
      .filter((u) => (statusFilter === 'ALL' ? true : u.status === statusFilter))
      .filter((u) => (selectedFloor === 'ALL' ? true : (u.floor ?? 1) === selectedFloor))
      .filter((u) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const contract = contractsMap[u.id];
        return (
          u.code.toLowerCase().includes(term) ||
          (u.position && u.position.toLowerCase().includes(term)) ||
          (contract && contract.customerName.toLowerCase().includes(term)) ||
          (contract && contract.customerPhone.includes(term))
        );
      });

    // 2. Sort
    return filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'code':
          cmp = a.code.localeCompare(b.code, 'vi', { numeric: true });
          break;
        case 'floor':
          cmp = (a.floor ?? 1) - (b.floor ?? 1);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'customer': {
          const nameA = contractsMap[a.id]?.customerName || '';
          const nameB = contractsMap[b.id]?.customerName || '';
          cmp = nameA.localeCompare(nameB, 'vi');
          break;
        }
        case 'endDate': {
          const dateA = contractsMap[a.id]?.endDateExclusive || '';
          const dateB = contractsMap[b.id]?.endDateExclusive || '';
          cmp = dateA.localeCompare(dateB);
          break;
        }
        default:
          cmp = 0;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [
    storageUnits,
    statusFilter,
    selectedFloor,
    searchTerm,
    contractsMap,
    sortField,
    sortDirection,
  ]);

  // Phân trang
  const totalPages = Math.ceil(processedUnits.length / PAGE_SIZE) || 1;
  const paginatedUnits = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return processedUnits.slice(startIndex, startIndex + PAGE_SIZE);
  }, [processedUnits, currentPage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Cấp 3 */}
      <Breadcrumb
        items={[
          {
            label: facility?.name || `Cơ sở #${facilityIdNum}`,
            to: `/manager/facilities/${facilityIdNum}`,
            icon: Building2,
          },
          {
            label: unitType?.name || `Loại kho #${typeIdNum}`,
            icon: Layers,
          },
        ]}
      />

      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh sách Ô kho vật lý
            </h1>
            {unitType && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                {unitType.name} ({unitType.areaM2} m²)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý hiện trạng từng ô kho thuộc loại {unitType?.name || 'kho'}, giám sát người thuê và thời hạn hợp đồng
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setSuModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ô kho vật lý</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Bar: Đưa thông tin Trống / Đang thuê / Bảo trì / Lấp đầy từ cấp ngoài vào cấp trong */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {/* 1. Tổng số ô */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-sm ${
            statusFilter === 'ALL'
              ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">Tổng ô kho</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-slate-900">{statsOverview.total}</span>
            <span className="text-xs text-slate-400">ô</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Quy mô hiện tại</span>
        </div>

        {/* 2. Ô còn trống */}
        <div
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-sm ${
            statusFilter === 'AVAILABLE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'border-emerald-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700">Ô còn trống</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-emerald-700">{statsOverview.available}</span>
            <span className="text-xs text-emerald-600">ô</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-1 block">Sẵn sàng nhận khách</span>
        </div>

        {/* 3. Đang cho thuê */}
        <div
          onClick={() => setStatusFilter('OCCUPIED')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-sm ${
            statusFilter === 'OCCUPIED'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30'
              : 'border-amber-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700">Đang thuê</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-amber-700">{statsOverview.occupied}</span>
            <span className="text-xs text-amber-600">ô</span>
          </div>
          <span className="text-[10px] text-amber-600 font-medium mt-1 block">Hợp đồng hiệu lực</span>
        </div>

        {/* 4. Đang bảo trì */}
        <div
          onClick={() => setStatusFilter('MAINTENANCE')}
          className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer bg-white shadow-2xs hover:shadow-sm ${
            statusFilter === 'MAINTENANCE'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30'
              : 'border-rose-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700">Đang bảo trì</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-rose-700">{statsOverview.maintenance}</span>
            <span className="text-xs text-rose-600">ô</span>
          </div>
          <span className="text-[10px] text-rose-600 font-medium mt-1 block">Tạm ngưng khai thác</span>
        </div>

        {/* 5. Tỷ lệ lấp đầy */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1 p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
              Tỷ lệ lấp đầy
            </span>
            <span
              className={`text-xs font-mono font-bold ${
                statsOverview.isFull
                  ? 'text-rose-600'
                  : statsOverview.isNearFull
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {statsOverview.occupancyRate.toFixed(0)}%
            </span>
          </div>

          <div className="my-2.5">
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  statsOverview.isFull
                    ? 'bg-rose-500'
                    : statsOverview.isNearFull
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, statsOverview.occupancyRate))}%` }}
              />
            </div>
          </div>

          <span className="text-[10px] text-slate-400">
            {statsOverview.isFull
              ? 'Đã kín chỗ 100%'
              : statsOverview.isNearFull
              ? 'Sắp lấp đầy (≥75%)'
              : statsOverview.available > 0
              ? `Còn ${statsOverview.available} ô sẵn sàng`
              : '0 ô trống khả dụng'}
          </span>
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

      {/* Tabs Filter theo Trạng thái & Dropdown Tầng & Ô tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Status Tabs + Floor Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs Bar */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {STATUS_FILTERS.map((tab) => {
              const isActive = statusFilter === tab.value;
              const count = filterCounts[tab.value] || 0;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
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

          {/* Floor Dropdown Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500 whitespace-nowrap">Tầng:</span>
            <select
              value={selectedFloor}
              onChange={(e) =>
                setSelectedFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các tầng</option>
              {availableFloors.map((fl) => (
                <option key={fl} value={fl}>
                  Tầng {fl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Tìm kiếm nhanh ô kho */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mã ô, vị trí, khách thuê..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Table Danh sách Ô kho & Phân trang */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          <StorageUnitTable
            units={paginatedUnits}
            contractsMap={contractsMap}
            onSelectUnit={(unit) =>
              navigate(
                `/manager/facilities/${facilityIdNum}/unit-types/${typeIdNum}/units/${unit.id}`
              )
            }
            onStatusChange={handleStatusChange}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {/* Phân trang: Threshold > 10 items */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedUnits.length}
            pageSize={PAGE_SIZE}
            threshold={10}
            itemName="ô kho"
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Modal Thêm ô kho vật lý */}
      <StorageUnitFormModal
        isOpen={suModalOpen}
        unitTypes={unitType ? [unitType] : []}
        defaultUnitTypeId={typeIdNum}
        onClose={() => setSuModalOpen(false)}
        onSubmit={handleSubmitUnit}
      />
    </div>
  );
};
