// frontend/src/features/manager/pages/StorageUnitDetailPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Wrench,
  FileText,
  Repeat,
  Snowflake,
  ShieldCheck,
  Calendar,
  CalendarClock,
  DoorOpen,
  PackageCheck,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/api/client';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchUnitTypes, updateStorageUnitStatus } from '@/api/unit';
import { getManagerContracts } from '@/api/contract';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse, UnitTypeResponse, UnitStatus } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';
import { Breadcrumb } from '../components/Breadcrumb';
import { StatusBadge } from '../components/StatusBadge';
import { ReassignUnitModal } from '../components/ReassignUnitModal';
import { cleanUnitTypeName } from '../components/UnitTypeCard';

const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + ' đ';

// Helper date math & formatting
const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToStr = (baseDateStr: string, days: number): string => {
  const d = new Date(baseDateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatVnDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const clean = dateStr.substring(0, 10);
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const getDaysDiff = (targetDateStr: string, baseDateStr: string): number => {
  const d1 = new Date(targetDateStr.substring(0, 10)).getTime();
  const d2 = new Date(baseDateStr.substring(0, 10)).getTime();
  return Math.round((d1 - d2) / (1000 * 3600 * 24));
};

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

  const todayStr = useMemo(() => getTodayStr(), []);

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [unitType, setUnitType] = useState<UnitTypeResponse | null>(null);
  const [unit, setUnit] = useState<StorageUnitResponse | null>(null);
  const [currentContract, setCurrentContract] = useState<ManagerContractItem | null>(null);
  const [pastContracts, setPastContracts] = useState<ManagerContractItem[]>([]);

  // Góc nhìn vận hành & Lập kế hoạch: Hiện tại vs Dòng thời gian tương lai vs Lịch sử thuê
  const [viewPerspective, setViewPerspective] = useState<'NOW' | 'TIMELINE' | 'HISTORY'>('NOW');
  const [simulatedDate, setSimulatedDate] = useState<string>(addDaysToStr(todayStr, 30));

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
      // 1. Tải thông tin cơ sở, loại kho, chi tiết ô kho và hợp đồng liên quan
      const [facList, utRes, unitRes, contractsRes] = await Promise.all([
        fetchMyAssignedFacilities(),
        fetchUnitTypes(facilityIdNum, { size: 100 }),
        apiClient<ApiResponse<StorageUnitResponse>>(
          `/facilities/${facilityIdNum}/storage-units/${unitIdNum}`
        ),
        getManagerContracts({ facilityId: facilityIdNum, status: 'ALL' }),
      ]);

      const currentFac = facList.find((f) => f.id === facilityIdNum) || null;
      setFacility(currentFac);

      const types = utRes?.content || [];
      const currentType = types.find((t) => t.id === typeIdNum) || null;
      setUnitType(currentType);

      const unitData = unitRes?.data || null;
      setUnit(unitData);

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

  // Tính toán dự phóng tương lai cho ô kho này theo simulatedDate
  const projectedFutureInfo = useMemo(() => {
    if (!unit) return { status: 'AVAILABLE', label: 'Trống', note: '' };

    if (unit.status === 'MAINTENANCE') {
      return {
        status: 'MAINTENANCE',
        label: 'Bảo trì kỹ thuật',
        note: 'Ô kho đang trong quy trình bảo trì, chưa được mở bán',
      };
    }

    if (currentContract) {
      const cStart = currentContract.startDate ? currentContract.startDate.substring(0, 10) : '';
      const cEnd = currentContract.endDateExclusive ? currentContract.endDateExclusive.substring(0, 10) : '';

      if (cStart && cEnd && cStart <= simulatedDate && cEnd > simulatedDate) {
        return {
          status: 'OCCUPIED',
          label: 'Đang thuê',
          note: `Khách ${currentContract.customerName} thuê đến ${formatVnDate(cEnd)}`,
        };
      }
      if (cEnd && cEnd <= simulatedDate) {
        return {
          status: 'AVAILABLE',
          label: 'Trống (Sẵn sàng cho thuê)',
          note: `Hợp đồng cũ đáo hạn ngày ${formatVnDate(cEnd)}. Sẵn sàng đón khách mới`,
        };
      }
    }

    return {
      status: unit.status,
      label: unit.status === 'AVAILABLE' ? 'Trống (Sẵn sàng)' : unit.status,
      note: 'Sẵn sàng tiếp nhận đặt chỗ mới',
    };
  }, [unit, currentContract, simulatedDate]);

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

  const isClimate = Boolean(
    unitType?.code?.toUpperCase().includes('CLIMATE') ||
    unitType?.name.toLowerCase().includes('lạnh') ||
    unitType?.name.toLowerCase().includes('máy lạnh') ||
    unitType?.name.toLowerCase().includes('điều hòa')
  );

  const daysUntilExpiry = currentContract?.endDateExclusive
    ? getDaysDiff(currentContract.endDateExclusive, todayStr)
    : null;

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
            label: cleanUnitTypeName(unitType?.name) || `Loại kho #${typeIdNum}`,
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
              <span>{cleanUnitTypeName(unitType?.name) || 'Loại kho'}</span>
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

      {/* THANH BỘ LỌC GÓC NHÌN: HIỆN TẠI VS KẾ HOẠCH TƯƠNG LAI VS LỊCH SỬ THUÊ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setViewPerspective('NOW')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewPerspective === 'NOW'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-brand-600" />
            <span>Hiện tại (Thời gian thực)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewPerspective('TIMELINE')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewPerspective === 'TIMELINE'
                ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 text-purple-600" />
            <span>Kế hoạch & Dự phóng tương lai</span>
            {daysUntilExpiry !== null && daysUntilExpiry <= 14 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
                Trả sau {daysUntilExpiry}d
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewPerspective('HISTORY')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewPerspective === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Lịch sử hợp đồng ({pastContracts.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 pr-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
          <span>Góc nhìn điều phối công việc cho FM</span>
        </div>
      </div>

      {/* NỘI DUNG 1: GÓC NHÌN HIỆN TẠI (REAL-TIME PERSPECTIVE) */}
      {viewPerspective === 'NOW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-150">
          {/* Left Column (7 cols): Thông số kỹ thuật & Tiêu chuẩn vận hành */}
          <div className="lg:col-span-7 space-y-6">
            {/* Panel Thông số Kỹ thuật */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Box className="w-4 h-4 text-brand-600" />
                  Thông số kỹ thuật & Vị trí ô kho
                </h3>
                {isClimate ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                    <Snowflake className="w-3 h-3 text-cyan-600" />
                    Kho Máy Lạnh (20°C - 25°C)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Kho Tiêu Chuẩn
                  </span>
                )}
              </div>

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
                  <span className="text-slate-400 block text-[11px]">Vị trí dãy / phân khu</span>
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
                  <span className="text-slate-400 block text-[11px]">Thể tích lưu trữ</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                    {unitType?.volumeM3 ? `${unitType.volumeM3} m³` : `${((unitType?.areaM2 || 0) * (unitType?.heightM || 2.5)).toFixed(1)} m³`}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Quy cách (R × D × C)</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                    {unitType?.widthM || 0}m × {unitType?.depthM || 0}m × {unitType?.heightM || 0}m
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-slate-400 block text-[11px]">Hạng loại ô kho</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {unitType?.name || 'Kho tiêu chuẩn'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Đơn giá niêm yết</span>
                  <span className="font-mono font-bold text-brand-600 text-sm mt-0.5 block">
                    {unitType?.monthlyPrice ? fmt(unitType.monthlyPrice) : 'Chưa niêm yết'}
                  </span>
                </div>
              </div>

              {unit.locationNote && (
                <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900">
                  <span className="font-bold">Ghi chú định vị mặt bằng:</span> {unit.locationNote}
                </div>
              )}
            </div>

            {/* Panel Tiêu chuẩn an ninh & Vận hành */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Tiêu chuẩn an toàn & Tiện ích kho bãi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">PCCC Tự Động 24/7</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Trang bị đầu phun Sprinkler và cảm biến nhiệt/khói tiêu chuẩn.</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Camera AI Giám Sát</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Hành lang phủ kín camera an ninh AI ghi hình liên tục 24/7.</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Kiểm Soát Vào Ra Điện Tử</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Cửa điện tử mã PIN và thẻ từ tự động hóa bảo mật tuyệt đối.</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Thang Tải Hàng & Xe Kéo</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Hỗ trợ xe nâng tay, xe đẩy 4 bánh và thang máy tải trọng 2 tấn.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Hợp đồng thuê / Trạng thái trống */}
          <div className="lg:col-span-5 space-y-6">
            {currentContract ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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

                {/* Nhắc nhở hạn hợp đồng nếu sắp đến ngày trả kho */}
                {daysUntilExpiry !== null && daysUntilExpiry <= 14 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <DoorOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        Sắp đến hạn trả phòng (còn {daysUntilExpiry} ngày):
                      </span>
                      <p className="mt-0.5 text-amber-800 text-[11px]">
                        FM cần chuẩn bị biên bản nghiệm thu (Inspection) và lập đối soát hoàn trả tiền cọc theo BR-DEP-04.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 text-xs">
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

                  {/* Kỳ hạn & Tiền cọc */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Bắt đầu</span>
                      <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                        {formatVnDate(currentContract.startDate)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Hạn thuê</span>
                      <span className="font-mono font-semibold text-slate-800 mt-0.5 block">
                        {formatVnDate(currentContract.endDateExclusive)}
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
                      onClick={() => navigate(`/manager/contracts/${currentContract.id}`)}
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
                        <span>Đổi ô kho do sự cố</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : unit.status === 'OCCUPIED' ? (
              <div className="bg-white rounded-2xl border border-amber-200/90 shadow-2xs p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ô kho ghi nhận Đang thuê nhưng chưa có Hợp đồng liên kết
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Hệ thống ghi nhận trạng thái ô kho là Đang thuê, nhưng hiện chưa tìm thấy hồ sơ hợp đồng điện tử nào đang hoạt động liên kết với ô kho này trong CSDL.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange('AVAILABLE')}
                    className="px-3.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors cursor-pointer"
                  >
                    🔄 Đưa về Trạng thái Trống
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
          </div>
        </div>
      )}

      {/* NỘI DUNG 2: GÓC NHÌN KẾ HOẠCH & DỰ PHÓNG TƯƠNG LAI (WORK SCHEDULE PERSPECTIVE) */}
      {viewPerspective === 'TIMELINE' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Thanh Mô phỏng Ngày tương lai (Timeline Simulator) */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-purple-950">
                    Mô phỏng Trạng thái Ô kho theo Ngày tương lai
                  </h3>
                  <p className="text-xs text-purple-700">
                    Dự báo chính xác tình trạng buồng kho tại bất kỳ mốc thời gian nào trong tương lai
                  </p>
                </div>
              </div>

              {/* Date Input & Quick Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={simulatedDate}
                  onChange={(e) => setSimulatedDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-mono font-bold text-purple-950 outline-none shadow-2xs cursor-pointer focus:ring-2 focus:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedDate(addDaysToStr(todayStr, 7))}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-200 cursor-pointer shadow-2xs"
                >
                  +7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDate(addDaysToStr(todayStr, 14))}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-200 cursor-pointer shadow-2xs"
                >
                  +14 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDate(addDaysToStr(todayStr, 30))}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-200 cursor-pointer shadow-2xs"
                >
                  +30 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDate(addDaysToStr(todayStr, 60))}
                  className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-200 cursor-pointer shadow-2xs"
                >
                  +60 ngày
                </button>
              </div>
            </div>

            {/* Hộp Kết quả Dự phóng */}
            <div className="p-4 bg-white rounded-xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <span className={`w-3.5 h-3.5 rounded-full ${
                  projectedFutureInfo.status === 'AVAILABLE'
                    ? 'bg-emerald-500 ring-4 ring-emerald-100'
                    : projectedFutureInfo.status === 'OCCUPIED'
                    ? 'bg-indigo-500 ring-4 ring-indigo-100'
                    : 'bg-rose-500 ring-4 ring-rose-100'
                }`} />
                <div>
                  <div className="text-xs text-slate-500 font-medium">
                    Tại ngày <strong>{formatVnDate(simulatedDate)}</strong>:
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                    Trạng thái: <span className="font-bold text-brand-700">{projectedFutureInfo.label}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-md italic">
                {projectedFutureInfo.note}
              </p>
            </div>
          </div>

          {/* Dòng thời gian kế hoạch công việc cho FM (Action Timeline) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Kế hoạch công việc & Tiến độ vận hành ô kho {unit.code}
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Cơ sở: <strong>{facility?.name || `ID #${facilityIdNum}`}</strong>
              </span>
            </div>

            <div className="space-y-4">
              {/* Mốc 1: Đáo hạn Hợp đồng hiện tại */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  currentContract ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {currentContract ? <DoorOpen className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      Mốc 1 — Hạn kết thúc hợp đồng & Nghiệm thu phòng
                    </span>
                    {currentContract && (
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Hạn: {formatVnDate(currentContract.endDateExclusive)} ({daysUntilExpiry !== null ? `còn ${daysUntilExpiry} ngày` : ''})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentContract ? (
                      <>
                        Khách hàng <strong>{currentContract.customerName}</strong> ({currentContract.customerPhone}) có hạn hợp đồng đến hết ngày <strong>{formatVnDate(currentContract.endDateExclusive)}</strong>.
                        FM cần liên hệ trước 3 ngày để thống nhất lịch nghiệm thu thực địa buồng kho (Inspection), kiểm tra trang thiết bị và đối soát hoàn trả cọc <strong>{fmt(currentContract.depositBalance || currentContract.depositAmount || 0)}</strong> theo BR-DEP-04.
                      </>
                    ) : (
                      <>Ô kho hiện đang trống, chưa có hợp đồng nào đang diễn ra.</>
                    )}
                  </p>
                </div>
              </div>

              {/* Mốc 2: Cửa sổ mở bán tiếp theo */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      Mốc 2 — Cửa sổ sẵn sàng đón khách thuê mới
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
                      {currentContract
                        ? `Từ ngày: ${formatVnDate(addDaysToStr(currentContract.endDateExclusive, 1))}`
                        : 'Sẵn sàng ngay hôm nay'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sau khi hợp đồng hiện tại thanh lý và hoàn tất 1 ngày dọn dẹp vệ sinh buffer, ô kho sẽ tự động chuyển sang trạng thái <strong>TRỐNG (AVAILABLE)</strong> trên hệ thống để Storage Customer có thể đặt chỗ và ký hợp đồng mới.
                  </p>
                </div>
              </div>

              {/* Mốc 3: Lịch kiểm định an toàn & Bảo trì định kỳ */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      Mốc 3 — Lịch kiểm định an toàn cơ sở định kỳ
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300">
                      Định kỳ mỗi 30 ngày
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    • Kiểm tra áp lực đầu phun Sprinkler PCCC và lau cảm biến khói trên trần.<br />
                    • Kiểm tra pin khóa mã PIN điện tử, tra dầu bản lề cửa buồng kho.<br />
                    {isClimate && (
                      <>• Đo nhiệt độ kho mát (20°C - 25°C) và vệ sinh lưới lọc máy lạnh tầng {unit.floor ?? 1}.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NỘI DUNG 3: GÓC NHÌN LỊCH SỬ HỢP ĐỒNG (HISTORY PERSPECTIVE) */}
      {viewPerspective === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-150">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Lịch sử hợp đồng thuê ô kho {unit.code} ({pastContracts.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Lưu trữ vĩnh viễn phục vụ đối soát và kiểm toán
            </span>
          </div>

          <div className="p-5">
            {pastContracts.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">Chưa có lịch sử hợp đồng thanh lý trước đây</p>
                <p className="text-[11px] text-slate-400 mt-1">Khi hợp đồng hiện tại kết thúc, hồ sơ sẽ được lưu vào bảng này</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="px-4 py-3">Mã HĐ</th>
                      <th className="px-4 py-3">Khách thuê</th>
                      <th className="px-4 py-3">Số điện thoại</th>
                      <th className="px-4 py-3">Kỳ hạn thuê</th>
                      <th className="px-4 py-3">Tiền cọc</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pastContracts.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{c.customerName}</td>
                        <td className="px-4 py-3 text-slate-600">{c.customerPhone}</td>
                        <td className="px-4 py-3 text-slate-600 font-mono">
                          {formatVnDate(c.startDate)} → {formatVnDate(c.endDateExclusive)}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                          {fmt(c.depositBalance || c.depositAmount || 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/manager/contracts/${c.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg font-semibold cursor-pointer transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
