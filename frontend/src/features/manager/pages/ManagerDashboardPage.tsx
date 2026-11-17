import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  FileText,
  Users,
  Wrench,
  ClipboardCheck,
  ChevronRight,
  RefreshCw,
  Search,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ListChecks,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchStorageUnits } from '@/api/unit';
import { listReservations, type ReservationResponse } from '@/api/reservation';
import { getManagerContracts } from '@/api/contract';
import { getManagementSupportRequests } from '../api/staffAssignmentApi';
import { StatusBadge } from '../components/StatusBadge';
import { formatDateVN } from '@/features/customer/utils/unitPickerHelpers';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse } from '@/types/unit';
import type { ManagerContractItem } from '@/types/contractManager';
import type { ManagementSupportTicket } from '../types/staffAssignment';

type ContractQuickFilter = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'OVERDUE' | 'PENDING_CHECK_IN';

const fmtVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';

function formatUpdatedTimestamp(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const weekday = date.toLocaleDateString('vi-VN', { weekday: 'long' });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hh}:${mm} - ${weekday}, ${day}/${month}/${year}`;
}

function getLocalTodayIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysUntilDate(iso?: string | null): number | null {
  if (!iso) return null;
  const clean = iso.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${clean}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDisplayDate(iso?: string | null): string {
  if (!iso) return '—';
  const clean = iso.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? formatDateVN(clean) : iso;
}

export const ManagerDashboardPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | 'ALL'>('ALL');
  const [units, setUnits] = useState<StorageUnitResponse[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [contracts, setContracts] = useState<ManagerContractItem[]>([]);
  const [incidents, setIncidents] = useState<ManagementSupportTicket[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(() => new Date());

  // Workspace Table filters
  const [contractSearch, setContractSearch] = useState('');
  const [contractFilter, setContractFilter] = useState<ContractQuickFilter>('ALL');

  // Mini-map floor selector
  const [miniMapFloor, setMiniMapFloor] = useState<number>(1);
  const [miniMapFacilityId, setMiniMapFacilityId] = useState<number | null>(null);

  const loadSummary = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const assignedFacilities = await fetchMyAssignedFacilities();
      setFacilities(assignedFacilities);
      const assignedIds = new Set(assignedFacilities.map((f) => f.id));

      const [unitResults, reservationsResult, contractsResult, incidentsResult] =
        await Promise.allSettled([
          Promise.allSettled(
            assignedFacilities.map((f) => fetchStorageUnits(f.id, { size: 500 }))
          ),
          listReservations({ status: 'PAID', size: 100 }),
          getManagerContracts({ status: 'ALL' }),
          getManagementSupportRequests({}),
        ]);

      const allUnits: StorageUnitResponse[] = [];
      if (unitResults.status === 'fulfilled') {
        unitResults.value.forEach((res) => {
          if (res.status === 'fulfilled' && Array.isArray(res.value?.content)) {
            allUnits.push(...res.value.content);
          }
        });
      }
      setUnits(allUnits);

      if (reservationsResult.status === 'fulfilled') {
        setReservations(
          (reservationsResult.value || []).filter(
            (r) => assignedIds.size === 0 || assignedIds.has(r.facilityId)
          )
        );
      }

      if (contractsResult.status === 'fulfilled') {
        setContracts(
          (contractsResult.value || []).filter(
            (c) => assignedIds.size === 0 || !c.facilityId || assignedIds.has(c.facilityId)
          )
        );
      }

      if (incidentsResult.status === 'fulfilled') {
        setIncidents(
          (incidentsResult.value || []).filter(
            (t) => assignedIds.size === 0 || !t.facilityId || assignedIds.has(t.facilityId)
          )
        );
      }

      setUpdatedAt(new Date());
    } catch (err) {
      console.error('Lỗi tải dữ liệu tổng quan cơ sở:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary(false);
  }, [loadSummary]);

  // Scope theo cơ sở đang chọn
  const scopedUnits = useMemo(
    () =>
      selectedFacilityId === 'ALL'
        ? units
        : units.filter((u) => u.facilityId === selectedFacilityId),
    [units, selectedFacilityId]
  );

  const scopedContracts = useMemo(
    () =>
      selectedFacilityId === 'ALL'
        ? contracts
        : contracts.filter((c) => c.facilityId === selectedFacilityId),
    [contracts, selectedFacilityId]
  );

  const scopedReservations = useMemo(
    () =>
      selectedFacilityId === 'ALL'
        ? reservations
        : reservations.filter((r) => r.facilityId === selectedFacilityId),
    [reservations, selectedFacilityId]
  );

  const scopedIncidents = useMemo(
    () =>
      selectedFacilityId === 'ALL'
        ? incidents
        : incidents.filter((t) => t.facilityId === selectedFacilityId),
    [incidents, selectedFacilityId]
  );

  // Operational Metrics (Command Center)
  const metrics = useMemo(() => {
    const todayIso = getLocalTodayIso(new Date());
    const totalUnits = scopedUnits.length;
    const occupiedUnits = scopedUnits.filter((u) => u.status === 'OCCUPIED').length;
    const availableUnits = scopedUnits.filter((u) => u.status === 'AVAILABLE').length;
    const maintenanceUnits = scopedUnits.filter((u) => u.status === 'MAINTENANCE').length;
    const occupancyPct = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const pendingAllocation = scopedReservations.filter((r) => !r.storageUnitId).length;

    const openIncidentList = scopedIncidents.filter(
      (t) => t.status === 'OPEN' || t.status === 'NEW' || t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED'
    );

    const overdueContracts = scopedContracts.filter((c) => c.status === 'OVERDUE');

    const expiringSoonContracts = scopedContracts.filter((c) => {
      if (c.status !== 'ACTIVE') return false;
      const d = daysUntilDate(c.endDateExclusive);
      return d !== null && d >= 0 && d <= 7;
    });

    const todayAppointments = scopedContracts.filter((c) => {
      const st = String(c.status || '').toUpperCase();
      if (st === 'PENDING_CHECK_IN' || st === 'PENDING_CHECKIN') {
        return !c.startDate || String(c.startDate).slice(0, 10) === todayIso;
      }
      return st === 'PENDING_RETURN' || st === 'NOTICE_SUBMITTED';
    }).length;

    const activeContracts = scopedContracts.filter((c) => c.status === 'ACTIVE');
    const activeMonthlyRevenue = activeContracts.reduce(
      (sum, c) => sum + Number(c.monthlyPrice || 0),
      0
    );

    // 7-day sparkline points: đếm số hợp đồng bắt đầu / hoạt động trong 7 ngày gần nhất
    const sparklinePoints = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - idx));
      const iso = getLocalTodayIso(d);
      const count = scopedContracts.filter((c) => {
        const start = c.startDate ? String(c.startDate).slice(0, 10) : '';
        const end = c.endDateExclusive ? String(c.endDateExclusive).slice(0, 10) : '9999-12-31';
        return start && start <= iso && end > iso && c.status !== 'CANCELLED';
      }).length;
      return count;
    });

    return {
      totalUnits,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      occupancyPct,
      pendingAllocation,
      openIncidentList,
      overdueContracts,
      expiringSoonContracts,
      todayAppointments,
      activeContractsCount: activeContracts.length,
      activeMonthlyRevenue,
      sparklinePoints,
    };
  }, [scopedUnits, scopedContracts, scopedReservations, scopedIncidents]);

  // Contracts Table (Stripe-style primary workspace)
  const filteredContracts = useMemo(() => {
    const q = contractSearch.trim().toLowerCase();
    const list = scopedContracts.filter((c) => {
      if (contractFilter === 'ACTIVE' && c.status !== 'ACTIVE') return false;
      if (contractFilter === 'OVERDUE' && c.status !== 'OVERDUE') return false;
      if (
        contractFilter === 'PENDING_CHECK_IN' &&
        c.status !== 'PENDING_CHECK_IN' &&
        (c.status as string) !== 'PENDING_CHECKIN'
      ) {
        return false;
      }
      if (contractFilter === 'EXPIRING') {
        const d = daysUntilDate(c.endDateExclusive);
        if (c.status !== 'ACTIVE' || d === null || d < 0 || d > 7) return false;
      }
      if (!q) return true;
      return (
        (c.code || '').toLowerCase().includes(q) ||
        (c.customerName || '').toLowerCase().includes(q) ||
        (c.storageUnitCode || '').toLowerCase().includes(q)
      );
    });

    // Ưu tiên hiển thị các hợp đồng cần chú ý trước (Quá hạn -> Sắp hết hạn -> Chờ nhận -> Đang hiệu lực)
    const priority = (c: ManagerContractItem) => {
      if (c.status === 'OVERDUE') return 0;
      const d = daysUntilDate(c.endDateExclusive);
      if (c.status === 'ACTIVE' && d !== null && d >= 0 && d <= 7) return 1;
      if (c.status === 'PENDING_CHECK_IN' || (c.status as string) === 'PENDING_CHECKIN') return 2;
      if (c.status === 'PENDING_RETURN' || (c.status as string) === 'INSPECTED') return 3;
      if (c.status === 'ACTIVE') return 4;
      return 5;
    };

    return [...list].sort((a, b) => priority(a) - priority(b)).slice(0, 8);
  }, [scopedContracts, contractFilter, contractSearch]);

  // Mini-Map data (grouped by facility & floor)
  const activeMiniMapFacilityId = useMemo(() => {
    if (selectedFacilityId !== 'ALL') return selectedFacilityId;
    if (miniMapFacilityId && facilities.some((f) => f.id === miniMapFacilityId)) {
      return miniMapFacilityId;
    }
    return facilities[0]?.id ?? null;
  }, [selectedFacilityId, miniMapFacilityId, facilities]);

  const miniMapUnits = useMemo(
    () =>
      activeMiniMapFacilityId
        ? units.filter((u) => u.facilityId === activeMiniMapFacilityId)
        : [],
    [units, activeMiniMapFacilityId]
  );

  const miniMapFloors = useMemo(() => {
    const set = new Set<number>();
    miniMapUnits.forEach((u) => set.add(u.floor ?? 1));
    const sorted = Array.from(set).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : [1];
  }, [miniMapUnits]);

  useEffect(() => {
    if (miniMapFloors.length > 0 && !miniMapFloors.includes(miniMapFloor)) {
      setMiniMapFloor(miniMapFloors[0]);
    }
  }, [miniMapFloors, miniMapFloor]);

  const floorMiniMapUnits = useMemo(
    () => miniMapUnits.filter((u) => (u.floor ?? 1) === miniMapFloor),
    [miniMapUnits, miniMapFloor]
  );

  const incidentUnitIds = useMemo(() => {
    const set = new Set<number>();
    metrics.openIncidentList.forEach((t) => {
      if (t.storageUnitId) set.add(t.storageUnitId);
    });
    return set;
  }, [metrics.openIncidentList]);

  const expiringOrOverdueUnitIds = useMemo(() => {
    const set = new Set<number>();
    metrics.expiringSoonContracts.forEach((c) => {
      if (c.storageUnitId) set.add(c.storageUnitId);
    });
    metrics.overdueContracts.forEach((c) => {
      if (c.storageUnitId) set.add(c.storageUnitId);
    });
    return set;
  }, [metrics.expiringSoonContracts, metrics.overdueContracts]);

  // SVG Sparkline path helper
  const sparklinePath = useMemo(() => {
    const pts = metrics.sparklinePoints;
    const maxVal = Math.max(...pts, 1);
    const minVal = Math.min(...pts, 0);
    const span = Math.max(maxVal - minVal, 1);
    const width = 140;
    const height = 36;
    const coords = pts.map((v, i) => {
      const x = (i / Math.max(pts.length - 1, 1)) * width;
      const y = height - 4 - ((v - minVal) / span) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return coords.join(' ');
  }, [metrics.sparklinePoints]);

  const topIncident = metrics.openIncidentList[0] || null;
  const activeMiniMapFacility = facilities.find((f) => f.id === activeMiniMapFacilityId);

  const businessShortcuts = [
    {
      to: '/manager/contracts',
      icon: FileText,
      label: 'Quản lý & Tạo hợp đồng',
      badge: metrics.overdueContracts.length > 0 ? `${metrics.overdueContracts.length} quá hạn` : null,
      badgeTone: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      to: '/manager/allocation',
      icon: ClipboardCheck,
      label: 'Gán ô kho',
      badge: metrics.pendingAllocation > 0 ? `${metrics.pendingAllocation} chờ` : null,
      badgeTone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      to: '/manager/waitlists',
      icon: ListChecks,
      label: 'Danh sách chờ (Waitlist)',
      badge: null,
      badgeTone: '',
    },
    {
      to: '/manager/incidents',
      icon: Wrench,
      label: 'Xử lý sự cố & Phiếu hỗ trợ',
      badge: metrics.openIncidentList.length > 0 ? `${metrics.openIncidentList.length} mở` : null,
      badgeTone: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      to: '/manager/staff-schedule',
      icon: Users,
      label: 'Phân công nhân sự',
      badge: metrics.todayAppointments > 0 ? `${metrics.todayAppointments} lịch` : null,
      badgeTone: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      to: '/manager/facilities',
      icon: Layers,
      label: 'Danh mục Ô kho & Sơ đồ',
      badge: null,
      badgeTone: '',
    },
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Header gọn gàng: Tiêu đề + Icon Refresh kế bên + Bộ lọc cơ sở */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Tổng quan Cơ sở
            </h1>
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              aria-label="Làm mới dữ liệu"
              title="Làm mới dữ liệu"
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
            {refreshing ? 'Đang cập nhật dữ liệu vận hành...' : `Cập nhật lúc: ${formatUpdatedTimestamp(updatedAt)}`}
          </p>
        </div>

        {facilities.length > 1 && (
          <select
            aria-label="Chọn cơ sở hiển thị"
            value={selectedFacilityId === 'ALL' ? 'ALL' : String(selectedFacilityId)}
            onChange={(e) =>
              setSelectedFacilityId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
            }
            className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer self-start sm:self-auto"
          >
            <option value="ALL">Tất cả cơ sở ({facilities.length})</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* KHU VỰC 1: COMMAND CENTER — Operational Snapshot (3 khối có chiều sâu) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Khối 1: Tình hình Kho (Occupancy + Progress Bar + Cảnh báo sắp hết hạn) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tình hình kho (Occupancy)
              </h2>
              <span className="text-xs font-semibold text-brand-700 tabular-nums">
                {loading ? '—' : `${metrics.occupancyPct}% lấp đầy`}
              </span>
            </div>

            {loading ? (
              <div className="h-9 w-28 bg-gray-100 rounded animate-pulse" />
            ) : (
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-gray-900 tabular-nums">
                    {metrics.occupiedUnits}/{metrics.totalUnits}
                  </span>
                  <span className="text-xs text-gray-500">ô đã thuê</span>
                </div>
                <span className="text-xs font-medium text-emerald-700 tabular-nums">
                  {metrics.availableUnits} ô trống
                </span>
              </div>
            )}

            {/* Progress Bar */}
            <div
              role="progressbar"
              aria-label="Tỷ lệ lấp đầy ô kho"
              aria-valuenow={metrics.occupancyPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mt-3"
            >
              <div
                className="h-full bg-brand-600 rounded-full transition-all duration-300"
                style={{ width: `${metrics.occupancyPct}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-xs">
            {metrics.expiringSoonContracts.length > 0 ? (
              <Link
                to="/manager/contracts"
                className="inline-flex items-center gap-1.5 font-medium text-amber-700 hover:text-amber-800 hover:underline"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {metrics.expiringSoonContracts.length} ô kho sắp hết hạn hợp đồng trong 7 ngày tới
                </span>
              </Link>
            ) : (
              <span className="text-gray-500 tabular-nums">
                Không có hợp đồng sắp hết hạn trong 7 ngày · {metrics.maintenanceUnits} ô bảo trì
              </span>
            )}
          </div>
        </div>

        {/* Khối 2: Việc cần làm ngay (Action Queue — Status First, Numbers Second) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Việc cần làm ngay
            </h2>
            <span className="text-[11px] font-medium text-gray-400">Ưu tiên xử lý</span>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {/* Row 1: Sự cố khẩn */}
            <div className="py-2 first:pt-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                    metrics.openIncidentList.length > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  Khẩn
                </span>
                <span className="text-gray-700 truncate">
                  {topIncident
                    ? `${metrics.openIncidentList.length} sự cố (${topIncident.storageUnitCode || topIncident.code})`
                    : '0 sự cố kỹ thuật đang mở'}
                </span>
              </div>
              <Link
                to={topIncident ? `/manager/incidents/${topIncident.id}` : '/manager/incidents'}
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
              >
                Xử lý
              </Link>
            </div>

            {/* Row 2: Đơn chờ gán ô */}
            <div className="py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                    metrics.pendingAllocation > 0
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  Chờ gán
                </span>
                <span className="text-gray-700 truncate tabular-nums">
                  {metrics.pendingAllocation} đơn đã thanh toán chưa gán ô
                </span>
              </div>
              <Link
                to="/manager/allocation"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
              >
                Gán ô
              </Link>
            </div>

            {/* Row 3: Lịch hẹn bàn giao / trả kho hôm nay */}
            <div className="py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                    metrics.todayAppointments > 0
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  Hôm nay
                </span>
                <span className="text-gray-700 truncate tabular-nums">
                  {metrics.todayAppointments} lịch tiếp đón / trả kho cần điều phối
                </span>
              </div>
              <Link
                to="/manager/staff-schedule"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
              >
                Xem lịch
              </Link>
            </div>

            {/* Row 4: Hợp đồng quá hạn */}
            <div className="py-2 last:pb-0 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                    metrics.overdueContracts.length > 0
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  Quá hạn
                </span>
                <span className="text-gray-700 truncate tabular-nums">
                  {metrics.overdueContracts.length} hợp đồng quá hạn thanh toán
                </span>
              </div>
              <Link
                to="/manager/contracts"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
              >
                Kiểm tra
              </Link>
            </div>
          </div>
        </div>

        {/* Khối 3: Hiệu suất vận hành (MRR + SVG Sparkline 7 ngày) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hiệu suất hợp đồng
              </h2>
              <span className="text-[11px] font-medium text-gray-400">7 ngày qua</span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                {loading ? (
                  <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900 tabular-nums">
                    {fmtVnd(metrics.activeMonthlyRevenue)}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-0.5 tabular-nums">
                  Doanh thu định kỳ / tháng ({metrics.activeContractsCount} HĐ hiệu lực)
                </p>
              </div>

              {/* Sparkline SVG tinh gọn */}
              <svg
                data-testid="performance-sparkline"
                viewBox="0 0 140 36"
                className="w-28 h-9 shrink-0 overflow-visible"
                aria-label="Biểu đồ xu hướng hợp đồng 7 ngày qua"
              >
                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={sparklinePath}
                />
              </svg>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-400 block text-[11px]">Hiệu lực</span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {metrics.activeContractsCount}
              </span>
            </div>
            <div className="border-l border-gray-100 pl-2">
              <span className="text-gray-400 block text-[11px]">Sắp hết hạn</span>
              <span className="font-semibold text-amber-700 tabular-nums">
                {metrics.expiringSoonContracts.length}
              </span>
            </div>
            <div className="border-l border-gray-100 pl-2">
              <span className="text-gray-400 block text-[11px]">Quá hạn</span>
              <span className="font-semibold text-rose-600 tabular-nums">
                {metrics.overdueContracts.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* KHU VỰC 2: WORKSPACE (2/3 Bảng Hợp đồng gần đây + 1/3 Lối tắt nghiệp vụ) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Cột Trái (2/3): Bảng Hợp đồng & Giao dịch gần đây (Stripe-style) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Hợp đồng &amp; Giao dịch cần theo dõi
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ưu tiên hiển thị hợp đồng quá hạn, sắp hết hạn và chờ nhận kho
              </p>
            </div>

            <Link
              to="/manager/contracts"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline shrink-0"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search & Quick Filter Bar */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contractSearch}
                onChange={(e) => setContractSearch(e.target.value)}
                placeholder="Tìm mã HĐ, khách thuê, ô kho..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {(
                [
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'OVERDUE', label: 'Quá hạn' },
                  { key: 'EXPIRING', label: 'Sắp hết hạn' },
                  { key: 'PENDING_CHECK_IN', label: 'Chờ nhận' },
                  { key: 'ACTIVE', label: 'Đang thuê' },
                ] as { key: ContractQuickFilter; label: string }[]
              ).map((tab) => {
                const active = contractFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setContractFilter(tab.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="py-10 px-6 text-center">
              <FileText className="w-7 h-7 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-800">
                Chưa có hợp đồng nào phù hợp
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Thử đổi bộ lọc hoặc mở trang Quản lý hợp đồng để tạo hợp đồng trực tiếp.
              </p>
              <Link
                to="/manager/contracts"
                className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-medium transition-colors"
              >
                <span>Đi tới Giám sát hợp đồng</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Mã HĐ</th>
                    <th className="py-2.5 px-4">Khách thuê</th>
                    <th className="py-2.5 px-4">Ô kho</th>
                    <th className="py-2.5 px-4">Hạn HĐ</th>
                    <th className="py-2.5 px-4">Trạng thái</th>
                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredContracts.map((c) => {
                    const daysLeft = daysUntilDate(c.endDateExclusive);
                    const isExpiring = c.status === 'ACTIVE' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-gray-900 whitespace-nowrap">
                          {c.code}
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">
                          {c.customerName}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-700 whitespace-nowrap">
                          {c.storageUnitCode || 'Chưa gán'}
                        </td>
                        <td className="py-3 px-4 tabular-nums whitespace-nowrap">
                          <span className={isExpiring ? 'text-amber-700 font-semibold' : 'text-gray-700'}>
                            {formatDisplayDate(c.endDateExclusive)}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Link
                            to={`/manager/contracts/${c.id}`}
                            className="inline-flex items-center gap-0.5 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cột Phải (1/3): Lối tắt nghiệp vụ (Shortcut-driven 1-line menu list) */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900">Lối tắt nghiệp vụ</h2>
            <p className="text-xs text-gray-500 mt-0.5">Thao tác nhanh một chạm</p>
          </div>

          <div className="divide-y divide-gray-100">
            {businessShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
                    <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 truncate">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border tabular-nums ${item.badgeTone}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* KHU VỰC 3: MINI-MAP TỔNG QUAN MẶT BẰNG CƠ SỞ */}
      <section
        data-testid="dashboard-floor-minimap"
        className="bg-white border border-gray-200 rounded-xl overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-bold text-gray-900">
              Tổng quan Mặt bằng Cơ sở
            </h2>
            {selectedFacilityId === 'ALL' && facilities.length > 1 ? (
              <select
                aria-label="Chọn cơ sở xem sơ đồ thu nhỏ"
                value={activeMiniMapFacilityId ?? ''}
                onChange={(e) => setMiniMapFacilityId(Number(e.target.value))}
                className="bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-xs font-medium text-gray-700 cursor-pointer"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            ) : activeMiniMapFacility ? (
              <span className="text-xs text-gray-500">· {activeMiniMapFacility.name}</span>
            ) : null}

            {/* Tabs chọn tầng */}
            <div className="inline-flex items-center gap-1 p-0.5 bg-gray-100 rounded-md border border-gray-200">
              {miniMapFloors.map((floor) => {
                const isActive = floor === miniMapFloor;
                return (
                  <button
                    key={floor}
                    type="button"
                    onClick={() => setMiniMapFloor(floor)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Tầng {floor}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-white border border-gray-300" />
              Trống
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-100 border border-blue-300" />
              Đang thuê
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-100 border border-amber-400" />
              Sắp hết hạn / Quá hạn
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-100 border border-rose-400" />
              Sự cố / Bảo trì
            </span>
            {activeMiniMapFacilityId && (
              <Link
                to={`/manager/facilities/${activeMiniMapFacilityId}`}
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Mở sơ đồ đầy đủ</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-14 rounded-md bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : floorMiniMapUnits.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              Chưa có dữ liệu ô kho tại Tầng {miniMapFloor}.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {floorMiniMapUnits.map((unit) => {
                const hasIncident = incidentUnitIds.has(unit.id) || unit.status === 'MAINTENANCE';
                const hasWarning = expiringOrOverdueUnitIds.has(unit.id);

                const tileStyle = hasIncident
                  ? 'bg-rose-50 border-rose-300 text-rose-900 hover:border-rose-500'
                  : hasWarning
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500'
                    : unit.status === 'OCCUPIED'
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900 hover:border-blue-400'
                      : unit.status === 'RESERVED'
                        ? 'bg-sky-50 border-sky-200 text-sky-900 hover:border-sky-400'
                        : 'bg-white border-gray-200 text-gray-800 hover:border-brand-500';

                return (
                  <Link
                    key={unit.id}
                    to={`/manager/facilities/${unit.facilityId}/unit-types/${unit.unitTypeId}/units/${unit.id}`}
                    className={`rounded-md border p-2.5 text-left transition-colors block ${tileStyle}`}
                    title={`${unit.code} · ${unit.unitTypeName || 'Ô kho'}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold truncate">{unit.code}</span>
                      {hasIncident && <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />}
                    </div>
                    <span className="text-[11px] opacity-75 truncate block mt-0.5">
                      {unit.unitTypeName || `Tầng ${unit.floor ?? 1}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
