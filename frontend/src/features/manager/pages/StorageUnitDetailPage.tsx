import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Building2,
  Layers,
  User,
  Phone,
  Mail,
  CreditCard,
  History,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Wrench,
  FileText,
  Repeat,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/api/client';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchUnitTypes, fetchStorageUnits, updateStorageUnitStatus } from '@/api/unit';
import { getManagerContracts } from '@/api/contract';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse, UnitTypeResponse, UnitStatus } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { StatusBadge } from '../components/StatusBadge';
import { MiniFloorPlan } from '../components/MiniFloorPlan';
import { ReassignUnitModal } from '../components/ReassignUnitModal';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';

export const StorageUnitDetailPage: React.FC = () => {
  const { facilityId, typeId, unitId } = useParams<{
    facilityId: string;
    typeId: string;
    unitId: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryContractId = Number(searchParams.get('contractId')) || 0;

  const facilityIdNum = Number(facilityId) || 0;
  const typeIdNum = Number(typeId) || 0;
  const unitIdNum = Number(unitId) || 0;

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [unitType, setUnitType] = useState<UnitTypeResponse | null>(null);
  const [unit, setUnit] = useState<StorageUnitResponse | null>(null);
  const [surroundingUnits, setSurroundingUnits] = useState<StorageUnitResponse[]>([]);
  const [currentContract, setCurrentContract] = useState<ManagerContractItem | null>(null);
  const [pastContracts, setPastContracts] = useState<ManagerContractItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const loadData = useCallback(async (isManual = false) => {
    if (!facilityIdNum || !unitIdNum) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // 1. Tải thông tin cơ sở & loại kho & chi tiết ô kho
      const [facList, utRes, unitRes, floorUnitsRes, contractsRes] = await Promise.all([
        fetchMyAssignedFacilities(),
        fetchUnitTypes(facilityIdNum, { size: 100 }),
        apiClient<ApiResponse<StorageUnitResponse>>(
          `/facilities/${facilityIdNum}/storage-units/${unitIdNum}`
        ),
        fetchStorageUnits(facilityIdNum, { size: 100 }),
        getManagerContracts({ facilityId: facilityIdNum, status: 'ALL' }),
      ]);

      const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
      setFacility(currentFac);

      const types = utRes?.content || [];
      const currentType = types.find((t) => t.id === typeIdNum) || null;
      setUnitType(currentType);

      const unitData = unitRes?.data || null;
      setUnit(unitData);

      setSurroundingUnits(floorUnitsRes?.content || []);

      // Lọc hợp đồng của ô kho này
      const allContracts = contractsRes || [];
      const unitContracts = allContracts.filter((c) => c.storageUnitId === unitIdNum);

      // Nếu người dùng điều hướng từ 1 hợp đồng cụ thể qua link (?contractId=...), ưu tiên hợp đồng đó
      const targetedContract = queryContractId
        ? unitContracts.find((c) => c.id === queryContractId)
        : null;

      const activeContract =
        targetedContract ||
        unitContracts.find(
          (c) =>
            c.status === 'ACTIVE' ||
            c.status === 'OVERDUE' ||
            (c.status as string) === 'PENDING_RETURN' ||
            c.status === 'PENDING_CHECK_IN'
        ) ||
        null;
      setCurrentContract(activeContract);

      // Các hợp đồng khác liên quan tới ô kho này (để xem trong danh sách lịch sử)
      const otherContracts = unitContracts.filter(
        (c) => !activeContract || c.id !== activeContract.id
      );
      setPastContracts(otherContracts);
    } catch (err) {
      console.error('Lỗi khi tải chi tiết ô kho:', err);
      setError('Không thể tải thông tin chi tiết ô kho.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [facilityIdNum, typeIdNum, unitIdNum, queryContractId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: UnitStatus) => {
    if (!unit) return;
    try {
      await updateStorageUnitStatus(facilityIdNum, unit.id, newStatus);
      await loadData(true);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-6 w-72 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          <div className="lg:col-span-5 h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy ô kho</h3>
        <p className="text-xs text-slate-500 mt-1">
          Ô kho #{unitIdNum} không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <button
          onClick={() => navigate(`/manager/facilities/${facilityIdNum}`)}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors cursor-pointer"
        >
          Quay lại danh mục
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb đầy đủ 4 cấp */}
      <Breadcrumb
        items={[
          {
            label: facility?.name || `Cơ sở #${facilityIdNum}`,
            to: `/manager/facilities/${facilityIdNum}`,
            icon: Building2,
          },
          {
            label: unitType?.name || `Loại kho #${typeIdNum}`,
            to: `/manager/facilities/${facilityIdNum}/unit-types/${typeIdNum}`,
            icon: Layers,
          },
          {
            label: `Ô ${unit.code}`,
            icon: Box,
          },
        ]}
      />

      {/* Top Banner: Thông tin vắn tắt & Thao tác nhanh */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-100">
            <Box className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-mono font-black text-slate-900 tracking-tight">
                Ô {unit.code}
              </h1>
              <StatusBadge status={unit.status} size="md" />
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Tầng {unit.floor ?? 1} — {unit.position || 'Chưa định vị'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span>{unitType?.name || 'Loại kho'}</span>
              <span>•</span>
              <span>Diện tích: {unitType?.areaM2 || 0} m²</span>
              <span>•</span>
              <span>Giá: {unitType?.monthlyPrice ? fmt(unitType.monthlyPrice) + '/tháng' : 'Chưa duyệt'}</span>
            </p>
          </div>
        </div>

        {/* Quick Status Buttons */}
        <div className="flex items-center gap-2">
          {unit.status === 'AVAILABLE' && (
            <button
              onClick={() => handleStatusChange('MAINTENANCE')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Chuyển sang bảo trì</span>
            </button>
          )}
          {unit.status === 'MAINTENANCE' && (
            <button
              onClick={() => handleStatusChange('AVAILABLE')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Kích hoạt sẵn sàng</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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

      {/* Main Content Layout (12 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Kỹ thuật + Sơ đồ mặt bằng mini */}
        <div className="lg:col-span-7 space-y-6">
          {/* Panel Thông số Kỹ thuật */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Box className="w-4 h-4 text-brand-600" />
              Thông số kỹ thuật & Vị trí mặt bằng
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Mã ô kho</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {unit.code}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Tầng</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  Tầng {unit.floor ?? 1}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Vị trí dãy / khu</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {unit.position || 'Chưa định vị'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Diện tích sàn</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {unitType?.areaM2 || 0} m²
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Loại mặt bằng</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                  {unitType?.name || 'Kho tiêu chuẩn'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Đơn giá thuê</span>
                <span className="font-mono font-bold text-brand-600 text-sm mt-0.5 block">
                  {unitType?.monthlyPrice ? fmt(unitType.monthlyPrice) : 'Chưa niêm yết'}
                </span>
              </div>
            </div>

            {unit.locationNote && (
              <div className="mt-4 p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-900">
                <span className="font-bold">Ghi chú vị trí:</span> {unit.locationNote}
              </div>
            )}
          </div>

          {/* Sơ đồ mặt bằng Mini Floor Plan */}
          <MiniFloorPlan
            currentUnit={unit}
            surroundingUnits={surroundingUnits}
            onSelectUnit={(targetId) => {
              navigate(
                `/manager/facilities/${facilityIdNum}/unit-types/${typeIdNum}/units/${targetId}`
              );
            }}
          />
        </div>

        {/* Right Column (5 cols): Hợp đồng thuê / Trạng thái trống & Lịch sử */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Hợp đồng đang thuê */}
          {currentContract ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Khách thuê & Hợp đồng hiện tại
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentContract.code}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Thông tin khách hàng */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Họ tên khách:</span>
                    <span className="font-bold text-slate-900">{currentContract.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Số điện thoại:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {currentContract.customerPhone}
                    </span>
                  </div>
                  {currentContract.customerEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Email:</span>
                      <span className="text-slate-700 flex items-center gap-1 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {currentContract.customerEmail}
                      </span>
                    </div>
                  )}
                </div>

                {/* Thông tin kỳ hạn & Tiền cọc */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Bắt đầu</span>
                    <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                      {currentContract.startDate || '—'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Hạn thuê</span>
                    <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                      {currentContract.endDateExclusive || '—'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Tiền cọc bảo chứng:
                  </span>
                  <span className="font-mono font-bold text-emerald-900">
                    {fmt(currentContract.depositBalance || currentContract.depositAmount || 0)}
                  </span>
                </div>

                {/* Nút thao tác hợp đồng */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() =>
                      navigate(
                        currentContract
                          ? `/manager/contracts/${currentContract.id}`
                          : `/manager/contracts`
                      )
                    }
                    className="w-full py-2 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-xl border border-brand-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Xem hợp đồng tại Giám sát hợp đồng</span>
                  </button>

                  {Boolean(currentContract.relocationEligible) && (
                    <button
                      onClick={() => setReassignModalOpen(true)}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Repeat className="w-3.5 h-3.5 text-amber-600" />
                      <span>Đổi ô kho do sự cố (Reassign)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : unit?.status === 'OCCUPIED' ? (
            <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs p-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Ô kho ghi nhận Đang thuê nhưng chưa có Hợp đồng liên kết
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Hệ thống ghi nhận trạng thái ô kho là Đang thuê ({unit?.status}), nhưng hiện chưa tìm thấy hồ sơ hợp đồng điện tử nào đang hoạt động liên kết với ô kho này trong CSDL.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('AVAILABLE')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors cursor-pointer"
                >
                  🔄 Đưa về Trạng thái Trống (AVAILABLE)
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Ô kho đang trống</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Hiện tại ô kho này chưa có khách thuê và sẵn sàng tiếp nhận yêu cầu đặt chỗ mới.
              </p>
            </div>
          )}

          {/* Panel Lịch sử thuê (Collapsible) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lịch sử thuê ô kho ({pastContracts.length})
                </span>
              </div>
              {historyOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {historyOpen && (
              <div className="p-4 pt-0 border-t border-slate-100">
                {pastContracts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 italic">
                    Chưa có lịch sử hợp đồng thanh lý trước đây
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {pastContracts.map((c) => (
                      <div
                        key={c.id}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                      >
                        <div>
                          <span className="font-mono font-bold text-slate-800">{c.code}</span>
                          <p className="text-[11px] text-slate-500">{c.customerName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {c.status}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {c.startDate} → {c.endDateExclusive}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/manager/contracts/${c.id}`)}
                            className="p-1.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết hợp đồng này"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Đổi ô kho ngoại lệ nếu đang thuê */}
      {currentContract && (
        <ReassignUnitModal
          isOpen={reassignModalOpen}
          contract={currentContract}
          onClose={() => setReassignModalOpen(false)}
          onSuccess={(_updated, _msg) => {
            setReassignModalOpen(false);
            loadData(true);
          }}
        />
      )}
    </div>
  );
};
