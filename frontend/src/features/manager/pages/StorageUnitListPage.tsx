// frontend/src/features/manager/pages/StorageUnitListPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, AlertCircle, Building2, Layers } from 'lucide-react';
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
import { StorageUnitFormModal } from '../components/StorageUnitFormModal';

const STATUS_FILTERS: { label: string; value: UnitStatus | 'ALL'; countKey?: UnitStatus }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Trống', value: 'AVAILABLE' },
  { label: 'Đang thuê', value: 'OCCUPIED' },
  { label: 'Đã đặt', value: 'RESERVED' },
  { label: 'Bảo trì', value: 'MAINTENANCE' },
];

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
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal thêm ô kho
  const [suModalOpen, setSuModalOpen] = useState(false);

  const loadData = useCallback(async (isManual = false) => {
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
  }, [facilityIdNum, typeIdNum]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // Tính số lượng cho các tab filter
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: storageUnits.length };
    storageUnits.forEach((u) => {
      counts[u.status] = (counts[u.status] || 0) + 1;
    });
    return counts;
  }, [storageUnits]);

  const filteredUnits = storageUnits
    .filter((u) => (statusFilter === 'ALL' ? true : u.status === statusFilter))
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
              Danh sách Ô kho vật lý (Cấp 3)
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

      {/* Tabs Filter theo Trạng thái & Ô tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs Bar */}
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

        {/* Input Tìm kiếm nhanh ô kho */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã ô, khách thuê..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Table Danh sách Ô kho */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="h-6 w-48 bg-slate-200 rounded-lg animate-pulse mx-auto" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mx-auto" />
        </div>
      ) : (
        <StorageUnitTable
          units={filteredUnits}
          contractsMap={contractsMap}
          onSelectUnit={(unit) =>
            navigate(
              `/manager/facilities/${facilityIdNum}/unit-types/${typeIdNum}/units/${unit.id}`
            )
          }
          onStatusChange={handleStatusChange}
        />
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
