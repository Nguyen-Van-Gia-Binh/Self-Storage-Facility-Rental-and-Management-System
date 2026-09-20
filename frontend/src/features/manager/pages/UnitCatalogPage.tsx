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
import {
  mockUnitTypes,
  mockStorageUnits,
  MOCK_FACILITY_ID,
} from '@/mock/unitMockData';

// Dat USE_MOCK = false khi backend T2.8 san sang
const USE_MOCK = true;
const FACILITY_ID = MOCK_FACILITY_ID;

const STATUS_FILTERS: { label: string; value: UnitStatus | 'ALL' }[] = [
  { label: 'Tat ca', value: 'ALL' },
  { label: 'Trong', value: 'AVAILABLE' },
  { label: 'Dang thue', value: 'OCCUPIED' },
  { label: 'Da dat', value: 'RESERVED' },
  { label: 'Bao tri', value: 'MAINTENANCE' },
];

export const UnitCatalogPage: React.FC = () => {
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

  const loadUnitTypes = useCallback(async () => {
    try {
      setLoading(true);
      if (USE_MOCK) {
        setUnitTypes(mockUnitTypes);
        setSelectedTypeId((prev) => prev ?? mockUnitTypes[0]?.id ?? null);
      } else {
        const res = await fetchUnitTypes(FACILITY_ID, { size: 50 });
        setUnitTypes(res.content);
        setSelectedTypeId((prev) => prev ?? res.content[0]?.id ?? null);
      }
    } catch {
      setError('Khong the tai danh sach loai o kho.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStorageUnits = useCallback(async () => {
    if (!selectedTypeId) { setStorageUnits([]); return; }
    try {
      if (USE_MOCK) {
        setStorageUnits(
          mockStorageUnits.filter((u) => u.unitTypeId === selectedTypeId)
        );
      } else {
        const res = await fetchStorageUnits(FACILITY_ID, {
          unitTypeId: selectedTypeId,
          size: 100,
        });
        setStorageUnits(res.content);
      }
    } catch {
      setError('Khong the tai danh sach o kho.');
    }
  }, [selectedTypeId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadUnitTypes(); }, [loadUnitTypes]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadStorageUnits(); }, [loadStorageUnits]);

  const selectedType = unitTypes.find((t) => t.id === selectedTypeId);
  const visibleTypes = showInactive ? unitTypes : unitTypes.filter((t) => t.isActive);
  const filteredUnits =
    statusFilter === 'ALL'
      ? storageUnits
      : storageUnits.filter((u) => u.status === statusFilter);

  const handleSubmitType = async (data: UnitTypeFormData) => {
    if (USE_MOCK) {
      if (editingType) {
        setUnitTypes((p) =>
          p.map((t) =>
            t.id === editingType.id
              ? { ...t, ...data, areaM2: +(data.widthM * data.depthM).toFixed(1) }
              : t
          )
        );
      } else {
        const newType: UnitTypeResponse = {
          id: Date.now(),
          facilityId: FACILITY_ID,
          ...data,
          areaM2: +(data.widthM * data.depthM).toFixed(1),
          totalUnits: 0,
          isActive: true,
        };
        setUnitTypes((p) => [...p, newType]);
      }
    } else {
      if (editingType) {
        await updateUnitType(FACILITY_ID, editingType.id, data);
      } else {
        await createUnitType(FACILITY_ID, data);
      }
      await loadUnitTypes();
    }
  };

  const handleToggleType = async (type: UnitTypeResponse) => {
    if (USE_MOCK) {
      setUnitTypes((p) =>
        p.map((t) => (t.id === type.id ? { ...t, isActive: !t.isActive } : t))
      );
    } else {
      await toggleUnitTypeStatus(FACILITY_ID, type.id, !type.isActive);
      await loadUnitTypes();
    }
  };

  const handleSubmitUnit = async (data: StorageUnitFormData) => {
    if (USE_MOCK) {
      const newUnit: StorageUnitResponse = {
        id: Date.now(),
        facilityId: FACILITY_ID,
        ...data,
        status: 'AVAILABLE',
        isActive: true,
      };
      setStorageUnits((p) => [...p, newUnit]);
    } else {
      await createStorageUnit(FACILITY_ID, data);
      await loadStorageUnits();
    }
  };

  const handleChangeUnitStatus = async (unit: StorageUnitResponse, status: UnitStatus) => {
    if (USE_MOCK) {
      setStorageUnits((p) =>
        p.map((u) => (u.id === unit.id ? { ...u, status } : u))
      );
    } else {
      await updateStorageUnitStatus(FACILITY_ID, unit.id, status);
      await loadStorageUnits();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#8890A4] text-sm">Dang tai du lieu...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#0F1117] text-[#E8EAF0] min-h-screen -m-6">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E3652]">
        <div>
          <h1 className="text-lg font-semibold">Quan ly o kho</h1>
          <p className="text-xs text-[#8890A4] mt-0.5">
            Danh muc loai o kho va o kho vat ly trong co so
          </p>
        </div>
        <button
          id="btn-add-unit-type"
          onClick={() => {
            setEditingType(null);
            setUtModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#4F7FFA] text-white text-sm font-medium rounded-lg hover:bg-[#3D6AE8] transition-colors"
        >
          <span>+</span> Them loai o kho
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-3 text-sm text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2">
          {error}{' '}
          <button onClick={() => setError(null)} className="ml-2 underline">
            Dong
          </button>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Unit Type list */}
        <aside className="w-72 shrink-0 border-r border-[#2E3652] flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2E3652] flex items-center justify-between">
            <span className="text-xs font-medium text-[#8890A4] uppercase tracking-wide">
              Loai o kho
            </span>
            <label className="flex items-center gap-1.5 text-xs text-[#8890A4] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="accent-[#4F7FFA]"
              />
              Hien vo hieu
            </label>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {visibleTypes.length === 0 ? (
              <p className="text-xs text-[#8890A4] text-center py-8">
                Chua co loai o kho nao.
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
              Chon mot loai o kho o ben trai de xem danh sach o kho vat ly.
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
                    <span className="font-mono">
                      {new Intl.NumberFormat('vi-VN').format(selectedType.monthlyPrice)}{' '}
                      VND/thang
                    </span>
                  </span>
                </div>
                <button
                  id="btn-add-storage-unit"
                  onClick={() => setSuModalOpen(true)}
                  disabled={!selectedType.isActive}
                  title={
                    !selectedType.isActive
                      ? 'Loai o kho dang vo hieu - khong the them o kho moi'
                      : undefined
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#222840] border border-[#2E3652] text-sm rounded-lg hover:border-[#4F7FFA] hover:bg-[#1A2A4A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>+</span> Them o kho
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
                    Khong co o kho nao khop bo loc.
                  </div>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-[#0F1117] z-10">
                      <tr className="border-b border-[#2E3652]">
                        {['Ma o', 'Tang', 'Vi tri', 'Trang thai', 'Thao tac'].map((h) => (
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
                            Tang {unit.floor}
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
                                className="text-xs text-orange-400 hover:text-orange-300 hover:underline"
                              >
                                Chuyen bao tri
                              </button>
                            )}
                            {unit.status === 'MAINTENANCE' && (
                              <button
                                onClick={() =>
                                  handleChangeUnitStatus(unit, 'AVAILABLE')
                                }
                                className="text-xs text-green-400 hover:text-green-300 hover:underline"
                              >
                                Hoan thanh bao tri
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
                {filteredUnits.length} / {storageUnits.length} o kho
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
