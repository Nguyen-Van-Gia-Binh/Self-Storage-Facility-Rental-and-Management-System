// frontend/src/features/manager/pages/UnitTypeListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, RefreshCw, AlertCircle, Box, Building2 } from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import {
  fetchUnitTypes,
  fetchStorageUnits,
  createUnitType,
  updateUnitType,
  toggleUnitTypeStatus,
} from '@/api/unit';
import type { FacilityListItem } from '@/types';
import type { UnitTypeResponse, UnitTypeFormData } from '@/types/unit';
import { Breadcrumb } from '../components/Breadcrumb';
import { UnitTypeCard } from '../components/UnitTypeCard';
import type { UnitTypeBreakdownStats } from '../components/UnitTypeCard';
import { UnitTypeFormModal } from '../components/UnitTypeFormModal';

export const UnitTypeListPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const facilityIdNum = Number(facilityId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [unitTypes, setUnitTypes] = useState<UnitTypeResponse[]>([]);
  const [typeStatsMap, setTypeStatsMap] = useState<Record<number, UnitTypeBreakdownStats>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [utModalOpen, setUtModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<UnitTypeResponse | null>(null);

  const loadData = useCallback(async (isManual = false) => {
    if (!facilityIdNum) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Lấy thông tin cơ sở
      const facList = await fetchMyAssignedFacilities();
      const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
      setFacility(currentFac);

      // 2. Lấy danh sách loại ô kho
      const utRes = await fetchUnitTypes(facilityIdNum, { size: 100 });
      const types = utRes?.content || [];
      setUnitTypes(types);

      // 3. Lấy danh sách toàn bộ ô kho của cơ sở để tính mini-stats theo từng loại
      const suRes = await fetchStorageUnits(facilityIdNum, { size: 500 });
      const units = suRes?.content || [];

      const statsMap: Record<number, UnitTypeBreakdownStats> = {};
      types.forEach((t) => {
        const matchingUnits = units.filter((u) => u.unitTypeId === t.id);
        statsMap[t.id] = {
          total: matchingUnits.length,
          available: matchingUnits.filter((u) => u.status === 'AVAILABLE').length,
          occupied: matchingUnits.filter((u) => u.status === 'OCCUPIED').length,
          maintenance: matchingUnits.filter((u) => u.status === 'MAINTENANCE').length,
        };
      });
      setTypeStatsMap(statsMap);
    } catch (err) {
      console.error('Lỗi tải danh mục loại kho:', err);
      setError('Không thể tải danh sách loại ô kho của cơ sở.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [facilityIdNum]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitType = async (data: UnitTypeFormData) => {
    try {
      if (!data.code) {
        data.code = 'UT-' + Date.now().toString().slice(-6);
      }
      if (editingType) {
        await updateUnitType(facilityIdNum, editingType.id, data);
      } else {
        await createUnitType(facilityIdNum, data);
      }
      setUtModalOpen(false);
      setEditingType(null);
      await loadData(true);
    } catch (err: any) {
      console.error(err);
      const apiMsg = err?.response?.data?.message;
      const msg = apiMsg || (err instanceof Error ? err.message : 'Lưu loại ô kho thất bại.');
      setError(msg);
      throw new Error(msg);
    }
  };

  const handleToggleType = async (type: UnitTypeResponse) => {
    try {
      const isActive = type.isActive ?? type.active ?? true;
      await toggleUnitTypeStatus(facilityIdNum, type.id, !isActive);
      await loadData(true);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Không thể thay đổi trạng thái loại ô kho.');
    }
  };

  const isTypeActive = (t: UnitTypeResponse) => t.isActive ?? t.active ?? true;

  const filteredTypes = unitTypes
    .filter((t) => (showInactive ? true : isTypeActive(t)))
    .filter((t) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(term) ||
        (t.code && t.code.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb cấp 2 */}
      <Breadcrumb
        items={[
          {
            label: facility?.name || `Cơ sở #${facilityIdNum}`,
            icon: Building2,
          },
        ]}
      />

      {/* Header bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Danh sách Loại ô kho (Cấp 2)
            </h1>
            {facility && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                {facility.name} ({facility.code})
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chọn một loại ô kho để xem danh sách các ô kho vật lý hoặc cấu hình bảng thông số kỹ thuật
          </p>
        </div>

        {/* Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm loại ô kho..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none px-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-3.5 h-3.5 accent-brand-500 rounded cursor-pointer"
            />
            <span>Hiện loại vô hiệu</span>
          </label>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setEditingType(null);
              setUtModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm loại ô kho</span>
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

      {/* Grid Danh sách Loại ô kho */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/80" />
          ))}
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Box className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Chưa có loại ô kho nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `Không tìm thấy loại ô kho nào khớp với "${searchTerm}".`
              : 'Cơ sở này chưa được cấu hình loại ô kho nào. Hãy bấm "+ Thêm loại ô kho" để bắt đầu.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTypes.map((type) => (
            <UnitTypeCard
              key={type.id}
              type={type}
              stats={typeStatsMap[type.id]}
              onClick={() => navigate(`/manager/facilities/${facilityIdNum}/unit-types/${type.id}`)}
              onEdit={() => {
                setEditingType(type);
                setUtModalOpen(true);
              }}
              onToggle={() => handleToggleType(type)}
            />
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa Loại kho */}
      <UnitTypeFormModal
        isOpen={utModalOpen}
        initialData={editingType}
        onClose={() => {
          setUtModalOpen(false);
          setEditingType(null);
        }}
        onSubmit={handleSubmitType}
      />
    </div>
  );
};
