// frontend/src/features/manager/pages/UnitCatalogPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { UnitTypeCard } from '../components/UnitTypeCard';
import { UnitTypeFormModal } from '../components/UnitTypeFormModal';
import { StorageUnitFormModal } from '../components/StorageUnitFormModal';
import { StatusBadge } from '../components/StatusBadge';
import type {
  UnitTypeResponse,
  StorageUnitResponse,
  UnitTypeFormData,
  StorageUnitFormData,
  UnitStatus,
} from '@/types/unit';
import {
  fetchUnitTypes,
  fetchStorageUnits,
  createUnitType,
  updateUnitType,
  toggleUnitTypeStatus,
  createStorageUnit,
  updateStorageUnitStatus,
} from '@/api/unit';
import { fetchFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';
import {
  mockUnitTypes,
  mockStorageUnits,
} from '@/mock/unitMockData';

const STATUS_FILTERS: { label: string; value: UnitStatus | 'ALL' }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Trống', value: 'AVAILABLE' },
  { label: 'Đang thuê', value: 'OCCUPIED' },
  { label: 'Đã đặt', value: 'RESERVED' },
  { label: 'Bảo trì', value: 'MAINTENANCE' },
];

export const UnitCatalogPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [facilityId, setFacilityId] = useState<number>(1);
  const [unitTypes, setUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [storageUnits, setStorageUnits] = useState<StorageUnitResponse[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<UnitStatus | 'ALL'>('ALL');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [utModalOpen, setUtModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<UnitTypeResponse | null>(null);
  const [suModalOpen, setSuModalOpen] = useState(false);

  // Tải danh sách cơ sở
  useEffect(() => {
    fetchFacilities()
      .then((list) => {
        setFacilities(list);
        if (list.length > 0 && !list.some((f) => f.id === facilityId)) {
          setFacilityId(list[0].id);
        }
      })
      .catch((err) => {
        console.error('Không thể tải danh sách cơ sở:', err);
      });
  }, []);

  const refreshUnitTypes = useCallback(async () => {
    try {
      const res = await fetchUnitTypes(facilityId, { size: 50 });
      if (res?.content && res.content.length > 0) {
        setUnitTypes(res.content);
        setSelectedTypeId((prev) => (res.content.some((t) => t.id === prev) ? prev : res.content[0].id));
      } else {
        setUnitTypes([]);
        setSelectedTypeId(null);
      }
    } catch {
      console.warn('Lỗi khi tải danh sách loại ô kho, sử dụng mock dự phòng');
      setUnitTypes(mockUnitTypes);
      setSelectedTypeId((prev) => prev ?? mockUnitTypes[0]?.id ?? null);
    }
  }, [facilityId]);

  const refreshStorageUnits = useCallback(async () => {
    if (!selectedTypeId) {
      setStorageUnits([]);
      return;
    }
    try {
      const res = await fetchStorageUnits(facilityId, {
        unitTypeId: selectedTypeId,
        size: 100,
      });
      if (res?.content) {
        setStorageUnits(res.content);
      } else {
        setStorageUnits([]);
      }
    } catch {
      console.warn('Lỗi khi tải danh sách ô kho, sử dụng mock dự phòng');
      setStorageUnits(
        mockStorageUnits.filter((u) => u.unitTypeId === selectedTypeId)
      );
    }
  }, [facilityId, selectedTypeId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchUnitTypes(facilityId, { size: 50 });
        if (!active) return;
        if (res?.content && res.content.length > 0) {
          setUnitTypes(res.content);
          setSelectedTypeId((prev) => (res.content.some((t) => t.id === prev) ? prev : res.content[0].id));
        } else {
          setUnitTypes([]);
          setSelectedTypeId(null);
        }
      } catch {
        if (!active) return;
        console.warn('Lỗi khi tải danh sách loại ô kho, sử dụng mock dự phòng');
        setUnitTypes(mockUnitTypes);
        setSelectedTypeId((prev) => prev ?? mockUnitTypes[0]?.id ?? null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [facilityId]);

  useEffect(() => {
    if (!selectedTypeId) {
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetchStorageUnits(facilityId, {
          unitTypeId: selectedTypeId,
          size: 100,
        });
        if (!active) return;
        if (res?.content) {
          setStorageUnits(res.content);
        } else {
          setStorageUnits([]);
        }
      } catch {
        if (!active) return;
        console.warn('Lỗi khi tải danh sách ô kho, sử dụng mock dự phòng');
        setStorageUnits(
          mockStorageUnits.filter((u) => u.unitTypeId === selectedTypeId)
        );
      }
    })();
    return () => { active = false; };
  }, [facilityId, selectedTypeId]);

  const selectedType = unitTypes.find((t) => t.id === selectedTypeId);
  const visibleTypes = showInactive ? unitTypes : unitTypes.filter((t) => t.isActive);
  const filteredUnits =
    statusFilter === 'ALL'
      ? storageUnits
      : storageUnits.filter((u) => u.status === statusFilter);

  const handleSubmitType = async (data: UnitTypeFormData) => {
    try {
      if (!data.code) {
        data.code = 'UT-' + Date.now().toString().slice(-6);
      }
      if (editingType) {
        await updateUnitType(facilityId, editingType.id, data);
      } else {
        await createUnitType(facilityId, data);
      }
      await refreshUnitTypes();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Lưu loại ô kho thất bại. Vui lòng kiểm tra lại.');
    }
  };

  const handleToggleType = async (type: UnitTypeResponse) => {
    try {
      await toggleUnitTypeStatus(facilityId, type.id, !type.isActive);
      await refreshUnitTypes();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái loại ô kho.');
    }
  };

  const handleSubmitUnit = async (data: StorageUnitFormData) => {
    try {
      await createStorageUnit(facilityId, data);
      await refreshStorageUnits();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Tạo ô kho mới thất bại.');
    }
  };

  const handleChangeUnitStatus = async (unit: StorageUnitResponse, status: UnitStatus) => {
    try {
      await updateStorageUnitStatus(facilityId, unit.id, status);
      await refreshStorageUnits();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Cập nhật trạng thái ô kho thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[#0F1117] text-[#E8EAF0] min-h-screen -m-6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-8 w-48 rounded-xl" />
          <div className="skeleton h-9 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="md:col-span-3 skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1117] text-[#E8EAF0] min-h-screen -m-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[#2E3652] gap-3">
        <div>
          <h1 className="text-lg font-semibold">Quản lý ô kho & Loại kho (FM-01)</h1>
          <p className="text-xs text-[#8890A4] mt-0.5">
            Danh mục loại ô kho và ô kho vật lý trong từng cơ sở
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bộ chọn cơ sở cho Quản lý */}
          {facilities.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8890A4]">Cơ sở:</span>
              <select
                id="select-facility"
                value={facilityId}
                onChange={(e) => setFacilityId(Number(e.target.value))}
                className="bg-[#1A1F2E] border border-[#2E3652] rounded-lg px-3 py-1.5 text-xs text-[#E8EAF0] focus:outline-none focus:border-[#4F7FFA] cursor-pointer"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.code} - {fac.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            id="btn-add-unit-type"
            onClick={() => {
              setEditingType(null);
              setUtModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4F7FFA] text-white text-sm font-medium rounded-lg hover:bg-[#3D6AE8] transition-colors shrink-0"
          >
            <span>+</span> Thêm loại ô kho
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Unit Type list */}
        <aside className="w-72 shrink-0 border-r border-[#2E3652] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2E3652] flex items-center justify-between">
            <span className="text-xs font-medium text-[#8890A4] uppercase tracking-wide">
              Loại ô kho
            </span>
            <label className="flex items-center gap-1.5 text-xs text-[#8890A4] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="accent-[#4F7FFA]"
              />
              Hiện vô hiệu
            </label>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {visibleTypes.length === 0 ? (
              <p className="text-xs text-[#8890A4] text-center py-8">
                Chưa có loại ô kho nào cho cơ sở này.
              </p>
            ) : (
              visibleTypes.map((type) => (
                <UnitTypeCard
                  key={type.id}
                  type={type}
                  isSelected={type.id === selectedTypeId}
                  onClick={() => {
                    setSelectedTypeId(type.id);
                    setStatusFilter('ALL');
                  }}
                  onEdit={() => {
                    setEditingType(type);
                    setUtModalOpen(true);
                  }}
                  onToggle={() => handleToggleType(type)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right panel — Storage Unit table */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!selectedType ? (
            <div className="flex items-center justify-center h-full text-[#8890A4] text-sm">
              Chọn một loại ô kho ở bên trái để xem danh sách ô kho vật lý.
            </div>
          ) : (
            <>
              {/* Right panel header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#2E3652]">
                <div>
                  <span className="text-sm font-semibold">{selectedType.name}</span>
                  <span className="ml-2 text-xs text-[#8890A4]">
                    {selectedType.widthM}m &times; {selectedType.depthM}m &times;{' '}
                    {selectedType.heightM}m &nbsp;&middot;&nbsp;
                    <span className="font-mono text-emerald-400 font-semibold">
                      {new Intl.NumberFormat('vi-VN').format(selectedType.monthlyPrice)}{' '}
                      VND/tháng
                    </span>
                  </span>
                </div>
                <button
                  id="btn-add-storage-unit"
                  onClick={() => setSuModalOpen(true)}
                  disabled={!selectedType.isActive}
                  title={
                    !selectedType.isActive
                      ? 'Loại ô kho đang vô hiệu - không thể thêm ô kho mới'
                      : undefined
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222840] border border-[#2E3652] text-sm rounded-lg hover:border-[#4F7FFA] hover:bg-[#1A2A4A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>+</span> Thêm ô kho
                </button>
              </div>

              {/* Status filter chips */}
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#2E3652] overflow-x-auto">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                      statusFilter === f.value
                        ? 'bg-[#4F7FFA] border-[#4F7FFA] text-white'
                        : 'border-[#2E3652] text-[#8890A4] hover:border-[#4F7FFA]/50 hover:text-[#E8EAF0]'
                    }`}
                  >
                    {f.label}
                    {f.value !== 'ALL' && (
                      <span className="ml-1 font-mono">
                        ({storageUnits.filter((u) => u.status === f.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Storage Unit table */}
              <div className="flex-1 overflow-y-auto">
                {filteredUnits.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-[#8890A4] text-sm">
                    Không có ô kho nào khớp bộ lọc.
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                      <tr className="border-b border-[#2E3652]">
                        {['Mã ô kho', 'Tầng', 'Khu vực / Vị trí', 'Trạng thái', 'Thao tác'].map((h) => (
                          <th
                            key={h}
                            className="text-left px-5 py-2.5 text-xs text-[#8890A4] font-medium"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.map((unit) => (
                        <tr
                          key={unit.id}
                          className="border-b border-[#2E3652] hover:bg-[#1A1F2E] transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-sm text-[#E8EAF0]">
                            {unit.code}
                          </td>
                          <td className="px-5 py-3 text-[#8890A4] text-sm">
                            Tầng {unit.floor}
                          </td>
                          <td className="px-5 py-3 font-mono text-[#8890A4] text-sm">
                            {unit.position}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={unit.status} />
                          </td>
                          <td className="px-5 py-3">
                            {unit.status === 'AVAILABLE' && (
                              <button
                                onClick={() =>
                                  handleChangeUnitStatus(unit, 'MAINTENANCE')
                                }
                                className="text-xs text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
                              >
                                Chuyển bảo trì
                              </button>
                            )}
                            {unit.status === 'MAINTENANCE' && (
                              <button
                                onClick={() =>
                                  handleChangeUnitStatus(unit, 'AVAILABLE')
                                }
                                className="text-xs text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                              >
                                Hoàn thành bảo trì
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table footer */}
              <div className="px-5 py-2.5 border-t border-[#2E3652] text-xs text-[#8890A4]">
                {filteredUnits.length} / {storageUnits.length} ô kho
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <UnitTypeFormModal
        isOpen={utModalOpen}
        onClose={() => {
          setUtModalOpen(false);
          setEditingType(null);
        }}
        onSubmit={handleSubmitType}
        initialData={editingType}
      />
      <StorageUnitFormModal
        isOpen={suModalOpen}
        onClose={() => setSuModalOpen(false)}
        onSubmit={handleSubmitUnit}
        unitTypes={unitTypes}
        defaultUnitTypeId={selectedTypeId ?? undefined}
      />
    </div>
  );
};
