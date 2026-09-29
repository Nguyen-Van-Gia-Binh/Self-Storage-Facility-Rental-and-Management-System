// frontend/src/features/manager/pages/UnitCatalogPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { UnitTypeCard } from '../components/UnitTypeCard';
import { UnitTypeFormModal } from '../components/UnitTypeFormModal';
import { StorageUnitFormModal } from '../components/StorageUnitFormModal';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Building2, Layers, Box, Wrench, CheckCircle2, AlertCircle, Snowflake, Package } from 'lucide-react';
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
import { fetchMyAssignedFacilities } from '@/api/facility';
import type { FacilityListItem } from '@/types';

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

  // Tải danh sách cơ sở phân công cho FM
  useEffect(() => {
    fetchMyAssignedFacilities()
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
    } catch (err) {
      console.error('Lỗi khi tải danh sách loại ô kho:', err);
      setUnitTypes([]);
      setSelectedTypeId(null);
      setError('Không thể tải danh sách loại ô kho từ máy chủ.');
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
    } catch (err) {
      console.error('Lỗi khi tải danh sách ô kho:', err);
      setStorageUnits([]);
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
      } catch (err) {
        if (!active) return;
        console.error('Lỗi khi tải danh sách loại ô kho:', err);
        setUnitTypes([]);
        setSelectedTypeId(null);
        setError('Không thể tải danh sách loại ô kho từ máy chủ.');
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
      } catch (err) {
        if (!active) return;
        console.error('Lỗi khi tải danh sách ô kho:', err);
        setStorageUnits([]);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-9 w-40 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          <div className="lg:col-span-8 h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Quản lý ô kho & Loại kho
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              FM-01
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Danh mục cấu hình loại ô kho và giám sát hiện trạng ô kho vật lý theo từng cơ sở
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bộ chọn cơ sở cho Quản lý */}
          {facilities.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-500">Cơ sở:</span>
              <select
                id="select-facility"
                value={facilityId}
                onChange={(e) => setFacilityId(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.code} — {fac.name}
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
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm loại ô kho
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:underline cursor-pointer">
            Đóng
          </button>
        </div>
      )}

      {/* Two-panel Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel — Unit Type list (4 cols) */}
        <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Loại ô kho ({visibleTypes.length})
              </span>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-3.5 h-3.5 accent-brand-500 rounded cursor-pointer"
              />
              Hiện loại vô hiệu
            </label>
          </div>
          <div className="p-4 space-y-3">
            {visibleTypes.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Box className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">Chưa có loại ô kho nào</p>
                <p className="text-[11px] text-slate-400 mt-1">Bấm "+ Thêm loại ô kho" để bắt đầu cấu hình</p>
              </div>
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

        {/* Right Panel — Storage Unit table (8 cols) */}
        <main className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
          {!selectedType ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <Layers className="w-7 h-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">Chọn một loại ô kho ở bên trái</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Danh sách các ô kho vật lý thực tế tương ứng sẽ hiển thị chi tiết tại đây.
              </p>
            </div>
          ) : (
            <>
              {/* Right Panel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-slate-100 gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-base font-bold text-slate-900">{selectedType.name}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/60 font-mono">
                      {selectedType.areaM2} m²
                    </span>
                    {(selectedType.code?.toUpperCase().includes('CLIMATE') ||
                      selectedType.name.toLowerCase().includes('lạnh') ||
                      selectedType.name.toLowerCase().includes('máy lạnh') ||
                      selectedType.name.toLowerCase().includes('điều hòa')) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                        <Snowflake className="w-3 h-3 text-cyan-600" />
                        Kho Máy Lạnh (22°C - 25°C)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        <Package className="w-3 h-3 text-slate-400" />
                        Kho Tiêu Chuẩn (Standard)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                    <span>
                      Kích thước: {selectedType.widthM}m &times; {selectedType.depthM}m &times; {selectedType.heightM}m
                    </span>
                    <span>&bull;</span>
                    <span>
                      Đơn giá: <strong className="font-mono text-brand-600">{new Intl.NumberFormat('vi-VN').format(selectedType.monthlyPrice)} đ/tháng</strong>
                    </span>
                  </div>
                </div>

                <button
                  id="btn-add-storage-unit"
                  onClick={() => setSuModalOpen(true)}
                  disabled={!selectedType.isActive}
                  title={!selectedType.isActive ? 'Loại ô kho đang vô hiệu — không thể thêm ô kho mới' : undefined}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm ô kho vật lý
                </button>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 overflow-x-auto bg-white">
                {STATUS_FILTERS.map((f) => {
                  const count = f.value === 'ALL'
                    ? storageUnits.length
                    : storageUnits.filter((u) => u.status === f.value).length;
                  const isSelected = statusFilter === f.value;
                  return (
                    <button
                      key={f.value}
                      onClick={() => setStatusFilter(f.value)}
                      className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-500 border-brand-500 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-slate-50'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Storage Units Table */}
              <div className="overflow-x-auto min-h-[300px]">
                {filteredUnits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Box className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Không có ô kho nào khớp với bộ lọc</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Chọn bộ lọc khác hoặc thêm ô kho mới</p>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Mã ô kho</th>
                        <th className="px-5 py-3">Tầng</th>
                        <th className="px-5 py-3">Khu vực / Dãy</th>
                        <th className="px-5 py-3">Trạng thái</th>
                        <th className="px-5 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUnits.map((unit) => (
                        <tr
                          key={unit.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-sm">
                            <div className="flex items-center gap-2">
                              <span>{unit.code}</span>
                              {(selectedType.code?.toUpperCase().includes('CLIMATE') ||
                                selectedType.name.toLowerCase().includes('lạnh') ||
                                selectedType.name.toLowerCase().includes('máy lạnh') ||
                                selectedType.name.toLowerCase().includes('điều hòa')) && (
                                <span title="Kho máy lạnh điều hòa nhiệt độ ổn định" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-sans font-bold text-cyan-700 bg-cyan-50 rounded border border-cyan-200/80">
                                  <Snowflake className="w-2.5 h-2.5 text-cyan-600" />
                                  Máy lạnh
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                            Tầng {unit.floor}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600 font-semibold">
                            {unit.position}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={unit.status} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {unit.status === 'AVAILABLE' && (
                              <button
                                onClick={() => handleChangeUnitStatus(unit, 'MAINTENANCE')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Chuyển ô kho sang diện bảo trì"
                              >
                                <Wrench className="w-3 h-3" />
                                Chuyển bảo trì
                              </button>
                            )}
                            {unit.status === 'MAINTENANCE' && (
                              <button
                                onClick={() => handleChangeUnitStatus(unit, 'AVAILABLE')}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                title="Đã sửa xong, đưa ô kho trở lại sử dụng"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Hoàn thành bảo trì
                              </button>
                            )}
                            {unit.status !== 'AVAILABLE' && unit.status !== 'MAINTENANCE' && (
                              <span className="text-xs text-slate-400 italic">Đang hoạt động</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Table Footer */}
              <div className="px-5 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500 bg-slate-50/50 flex items-center justify-between">
                <span>
                  Hiển thị <strong className="text-slate-800 font-bold">{filteredUnits.length}</strong> / {storageUnits.length} ô kho vật lý
                </span>
                <span className="text-[11px] text-slate-400">
                  Cơ sở ID: {facilityId}
                </span>
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
