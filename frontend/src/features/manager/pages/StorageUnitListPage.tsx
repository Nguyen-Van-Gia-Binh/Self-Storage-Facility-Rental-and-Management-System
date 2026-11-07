// frontend/src/features/manager/pages/StorageUnitListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Calendar,
  MapPin,
  X,
  Table2,
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
import { FacilityFloorPlanMapModal } from '../components/FacilityFloorPlanMapModal';
import { StorageUnitFloorPlanView } from '../components/StorageUnitFloorPlanView';
import { StorageUnitTable } from '../components/StorageUnitTable';
import type { StorageUnitSortField, SortDirection } from '../components/StorageUnitTable';
import { StorageUnitFormModal } from '../components/StorageUnitFormModal';
import { Pagination } from '../components/Pagination';
import { cleanUnitTypeName } from '../components/UnitTypeCard';

const STATUS_FILTERS: { label: string; value: UnitStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Trống', value: 'AVAILABLE' },
  { label: 'Đang thuê', value: 'OCCUPIED' },
  { label: 'Bảo trì', value: 'MAINTENANCE' },
];

const PAGE_SIZE = 10;

const formatVnDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.substring(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const StorageUnitListPage: React.FC = () => {
  const { facilityId, typeId } = useParams<{ facilityId: string; typeId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const startDateParam = searchParams.get('startDate') || searchParams.get('date') || '';
  const endDateParam = searchParams.get('endDate') || '';

  const facilityIdNum = Number(facilityId) || 0;
  const typeIdNum = Number(typeId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [unitType, setUnitType] = useState<UnitTypeResponse | null>(null);
  const [storageUnits, setStorageUnits] = useState<StorageUnitResponse[]>([]);
  const [contractsMap, setContractsMap] = useState<Record<number, ManagerContractItem>>({});
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>(startDateParam);
  const [endDate, setEndDate] = useState<string>(endDateParam);
  const [searchTerm, setSearchTerm] = useState('');

  // Đồng bộ startDate và endDate khi URL query param thay đổi
  useEffect(() => {
    if (startDateParam !== startDate) {
      setStartDate(startDateParam);
    }
  }, [startDateParam]);

  useEffect(() => {
    if (endDateParam !== endDate) {
      setEndDate(endDateParam);
    }
  }, [endDateParam]);

  const handleDateRangeChange = (newStart: string, newEnd: string) => {
    setStartDate(newStart);
    setEndDate(newEnd);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStart) {
        next.set('startDate', newStart);
      } else {
        next.delete('startDate');
      }
      if (newEnd) {
        next.set('endDate', newEnd);
      } else {
        next.delete('endDate');
      }
      next.delete('date');
      return next;
    });
  };

  // Sắp xếp cột bảng
  const [sortField, setSortField] = useState<StorageUnitSortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // Chế độ xem: Sơ đồ 2D mặt bằng (mặc định) vs Bảng danh sách
  const [viewMode, setViewMode] = useState<'floorplan' | 'table'>('floorplan');
  const [allFacilityUnits, setAllFacilityUnits] = useState<StorageUnitResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal thêm ô kho
  const [suModalOpen, setSuModalOpen] = useState(false);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);

  const loadData = useCallback(
    async (isManual = false) => {
      if (!facilityIdNum || !typeIdNum) return;
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        // 1. Tải cơ sở, loại kho, ô kho theo khoảng thời gian và toàn bộ hợp đồng
        const [facList, utRes, suRes, allSuRes, contractsRes] = await Promise.all([
          fetchMyAssignedFacilities(),
          fetchUnitTypes(facilityIdNum, { size: 100 }),
          fetchStorageUnits(facilityIdNum, {
            unitTypeId: typeIdNum,
            size: 200,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
          fetchStorageUnits(facilityIdNum, {
            size: 500,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          }),
          getManagerContracts({ facilityId: facilityIdNum, status: 'ALL' }),
        ]);

        const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
        setFacility(currentFac);

        const types = utRes?.content || [];
        const currentType = types.find((t) => t.id === typeIdNum) || null;
        setUnitType(currentType);

        setStorageUnits(suRes?.content || []);
        setAllFacilityUnits(allSuRes?.content || suRes?.content || []);

        // Ánh xạ hợp đồng còn hiệu lực với từng ô kho (động theo khoảng thời gian)
        const activeContracts = (contractsRes || []).filter(
          (c) =>
            c.status === 'ACTIVE' ||
            c.status === 'OVERDUE' ||
            (c.status as string) === 'PENDING_RETURN' ||
            c.status === 'PENDING_CHECK_IN'
        );
        const cMap: Record<number, ManagerContractItem> = {};
        activeContracts.forEach((c) => {
          if (!c.storageUnitId) return;

          if (startDate && endDate) {
            const start = c.startDate ? c.startDate.substring(0, 10) : '';
            const end = c.endDateExclusive ? c.endDateExclusive.substring(0, 10) : '';
            if (start && end && start < endDate && end > startDate) {
              cMap[c.storageUnitId] = c;
            }
          } else if (startDate) {
            const end = c.endDateExclusive ? c.endDateExclusive.substring(0, 10) : '';
            if (end && end > startDate) {
              cMap[c.storageUnitId] = c;
            }
          } else {
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
    [facilityIdNum, typeIdNum, startDate, endDate]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset về trang 1 khi đổi bộ lọc hoặc từ khóa
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, selectedFloor, sortField, sortDirection, startDate, endDate]);

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
            label: cleanUnitTypeName(unitType?.name) || `Loại kho #${typeIdNum}`,
            icon: Layers,
          },
        ]}
      />

      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Tầng 1: Tiêu đề & Các thao tác chính (Sơ đồ / Bảng, Làm mới, Thêm ô kho) */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Danh sách Ô kho vật lý
              </h1>
              {unitType && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                  {cleanUnitTypeName(unitType.name)} ({unitType.areaM2} m²)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Bộ chuyển đổi chế độ xem: Sơ đồ 2D vs Bảng danh sách */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('floorplan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'floorplan'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MapPin className={`w-3.5 h-3.5 ${viewMode === 'floorplan' ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>Sơ đồ 2D</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table2 className={`w-3.5 h-3.5 ${viewMode === 'table' ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>Bảng danh sách</span>
              </button>
            </div>

            {/* Nút Làm mới */}
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Nút Thêm ô kho vật lý */}
            <button
              onClick={() => setSuModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm ô kho vật lý</span>
            </button>
          </div>
        </div>

        {/* Tầng 2: Thanh lọc khoảng thời gian kiểm tra buồng kho */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-600" />
              Khoảng thời gian:
            </span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1 rounded-xl shadow-2xs">
              <span className="text-slate-500 font-medium text-xs">Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                className="bg-transparent font-mono font-bold text-slate-800 outline-none cursor-pointer"
              />
              <span className="text-slate-300">|</span>
              <span className="text-slate-500 font-medium text-xs">Đến ngày:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                className="bg-transparent font-mono font-bold text-slate-800 outline-none cursor-pointer"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => handleDateRangeChange('', '')}
                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 cursor-pointer text-xs flex items-center gap-1 transition-colors"
                title="Quay lại hôm nay (thời gian thực)"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xem hôm nay</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">
            {startDate && endDate ? (
              <span>
                Đang kiểm tra từ <strong className="font-mono text-brand-700 font-bold">{formatVnDate(startDate)}</strong> đến <strong className="font-mono text-brand-700 font-bold">{formatVnDate(endDate)}</strong>
              </span>
            ) : (
              <span>Hiển thị hiện trạng theo thời gian thực (Hôm nay)</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Summary Bar: Chỉ hiển thị trong chế độ Bảng danh sách để tránh trùng lặp thông tin với Sơ đồ 2D */}
      {viewMode === 'table' && (
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
      )}

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



      {/* Nội dung chính: Sơ đồ 2D mặt bằng vs Bảng danh sách chi tiết */}
      {viewMode === 'floorplan' ? (
        <StorageUnitFloorPlanView
          units={allFacilityUnits.length > 0 ? allFacilityUnits : storageUnits}
          contractsMap={contractsMap}
          currentUnitTypeId={typeIdNum}
          currentUnitTypeName={cleanUnitTypeName(unitType?.name) || 'Loại kho'}
          facilityName={facility?.name}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          onSelectUnit={(unit) =>
            navigate(
              `/manager/facilities/${facilityIdNum}/unit-types/${unit.unitTypeId || typeIdNum}/units/${unit.id}`
            )
          }
          onStatusChange={handleStatusChange}
        />
      ) : (
        <>

          {/* Tabs Filter theo Trạng thái & Dropdown Tầng & Bộ lọc Ngày & Ô tìm kiếm */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Status Tabs + Floor Filter + Date Filter */}
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
        </>
      )}

      {/* Modal Thêm ô kho vật lý */}
      <StorageUnitFormModal
        isOpen={suModalOpen}
        unitTypes={unitType ? [unitType] : []}
        defaultUnitTypeId={typeIdNum}
        onClose={() => setSuModalOpen(false)}
        onSubmit={handleSubmitUnit}
      />

      {/* Modal Sơ đồ 2D mặt bằng các tầng */}
      {facilityIdNum > 0 && (
        <FacilityFloorPlanMapModal
          isOpen={floorPlanOpen}
          onClose={() => setFloorPlanOpen(false)}
          facilityId={facilityIdNum}
          facilityName={facility?.name}
          allowedUnitTypeId={typeIdNum > 0 ? typeIdNum : undefined}
        />
      )}
    </div>
  );
};
