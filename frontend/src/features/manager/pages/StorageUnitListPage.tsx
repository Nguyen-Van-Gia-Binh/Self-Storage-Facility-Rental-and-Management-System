// frontend/src/features/manager/pages/StorageUnitListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DateField } from '@/components/ui/DateField';
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Building2,
  Layers,
  Filter,
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
  const [facilityUnitTypes, setFacilityUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [storageUnits, setStorageUnits] = useState<StorageUnitResponse[]>([]);
  const [contractsMap, setContractsMap] = useState<Record<number, ManagerContractItem>>({});
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'ALL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState<string>(startDateParam);
  const [endDate, setEndDate] = useState<string>(endDateParam);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(
    Boolean(startDateParam || endDateParam)
  );
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
        setFacilityUnitTypes(types);
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
        unitTypeId: data.unitTypeId || typeIdNum,
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
      let cmp: number;
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
      {/* Header phẳng chuẩn Enterprise: tiêu đề + phụ đề tóm tắt gọn, bỏ 5 thẻ Bento Box màu pastel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Danh sách Ô kho vật lý
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 tabular-nums">
            {unitType ? `${cleanUnitTypeName(unitType.name)} (${unitType.areaM2} m²)` : 'Tất cả loại kho'}
            {' · '}Tổng: <strong className="font-semibold text-gray-700">{statsOverview.total} ô kho</strong>
            {' · '}Trống: <strong className="font-semibold text-emerald-700">{statsOverview.available}</strong>
            {' · '}Lấp đầy: <strong className="font-semibold text-gray-700">{statsOverview.occupancyRate.toFixed(0)}%</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Bộ chuyển đổi chế độ xem: Sơ đồ 2D vs Bảng danh sách */}
          <div className="inline-flex h-9 items-center bg-gray-100 p-0.5 rounded-md border border-gray-200 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('floorplan')}
              className={`h-full px-2.5 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'floorplan'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${viewMode === 'floorplan' ? 'text-brand-700' : 'text-gray-400'}`} />
              <span>Sơ đồ 2D</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`h-full px-2.5 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table2 className={`w-3.5 h-3.5 ${viewMode === 'table' ? 'text-brand-700' : 'text-gray-400'}`} />
              <span>Bảng danh sách</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
            aria-label="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setSuModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 px-3 bg-brand-700 hover:bg-brand-800 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ô kho</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => loadData(true)} className="font-semibold underline cursor-pointer">
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
        <div className="space-y-3">
          {/* Toolbar tập trung 1 hàng: Search + Status Tabs + Floor + Bộ lọc ngày thu gọn */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Ô tìm kiếm */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm mã kho, khách thuê..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Status Tabs tích hợp Summary */}
              <div className="inline-flex h-9 items-center bg-gray-100 p-0.5 rounded-md border border-gray-200 overflow-x-auto">
                {STATUS_FILTERS.map((tab) => {
                  const isActive = statusFilter === tab.value;
                  const count = filterCounts[tab.value] || 0;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`h-full px-2.5 rounded text-xs transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${
                        isActive
                          ? 'bg-white text-gray-900 font-semibold shadow-2xs'
                          : 'text-gray-600 font-medium hover:text-gray-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="text-[11px] text-gray-400 tabular-nums">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Lọc theo Tầng */}
              <div className="inline-flex h-9 items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-300 rounded-md px-2.5">
                <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="text-gray-500 whitespace-nowrap">Tầng:</span>
                <select
                  value={selectedFloor}
                  onChange={(e) =>
                    setSelectedFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                  }
                  aria-label="Lọc theo tầng"
                  className="bg-transparent font-medium text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả</option>
                  {availableFloors.map((fl) => (
                    <option key={fl} value={fl}>
                      Tầng {fl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bộ lọc thời gian thu gọn (Bên phải) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDatePicker((prev) => !prev)}
                className={`inline-flex h-9 items-center gap-1.5 px-3 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                  startDate || endDate || showDatePicker
                    ? 'bg-brand-50/70 border-brand-300 text-brand-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <span>
                  {startDate && endDate
                    ? `Ngày: ${formatVnDate(startDate)} – ${formatVnDate(endDate)}`
                    : startDate
                    ? `Từ: ${formatVnDate(startDate)}`
                    : 'Ngày: Hôm nay'}
                </span>
              </button>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    handleDateRangeChange('', '');
                    setShowDatePicker(false);
                  }}
                  className="inline-flex h-9 items-center gap-1 px-2.5 rounded-md bg-white border border-gray-300 text-xs font-medium text-gray-600 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
                  title="Quay lại hôm nay"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Hôm nay</span>
                </button>
              )}
            </div>
          </div>

          {/* Popover / Thanh chọn khoảng ngày chỉ mở khi người dùng bấm vào nút Ngày */}
          {showDatePicker && (
            <div className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-medium text-gray-600">Kiểm tra lịch trống:</span>
                <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                  <span className="text-gray-500">Từ:</span>
                  <DateField
                    value={startDate}
                    onChange={(next) => handleDateRangeChange(next, endDate)}
                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer tabular-nums"
                  />
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">Đến:</span>
                  <DateField
                    value={endDate}
                    onChange={(next) => handleDateRangeChange(startDate, next)}
                    className="bg-transparent font-medium text-gray-900 outline-none cursor-pointer tabular-nums"
                  />
                </div>
              </div>
              <span className="text-gray-500">
                {startDate && endDate
                  ? `Đang lọc theo khoảng ${formatVnDate(startDate)} – ${formatVnDate(endDate)}`
                  : 'Mặc định hiển thị hiện trạng thời gian thực (Hôm nay)'}
              </span>
            </div>
          )}

          {/* Table Danh sách Ô kho & Phân trang */}
          {loading ? (
            <div className="bg-white rounded-md border border-gray-200 p-8 text-center space-y-3">
              <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
              <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
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
        </div>
      )}

      {/* Modal Thêm ô kho vật lý */}
      <StorageUnitFormModal
        isOpen={suModalOpen}
        unitTypes={facilityUnitTypes.length > 0 ? facilityUnitTypes : (unitType ? [unitType] : [])}
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
