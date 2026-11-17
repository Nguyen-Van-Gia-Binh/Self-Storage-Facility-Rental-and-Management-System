import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  FileText,
  Users,
  Wrench,
  ClipboardCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { fetchStorageUnits } from '@/api/unit';
import { listReservations } from '@/api/reservation';
import { getManagerContracts } from '@/api/contract';
import { getManagementSupportRequests } from '../api/staffAssignmentApi';

interface QuickAccessItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}

const QUICK_ACCESS_CARDS: QuickAccessItem[] = [
  {
    to: '/manager/allocation',
    icon: ClipboardCheck,
    label: 'Gán ô kho',
    desc: 'Phân bổ ô kho trống cùng hạng cho đơn đã thanh toán trước ngày nhận kho.',
  },
  {
    to: '/manager/contracts',
    icon: FileText,
    label: 'Hợp đồng & Khách thuê',
    desc: 'Theo dõi hợp đồng đang thuê, danh sách chờ bàn giao, đổi ô kho ngoại lệ và quyết toán hoàn cọc.',
  },
  {
    to: '/manager/facilities',
    icon: Layers,
    label: 'Danh mục Ô kho & Sơ đồ',
    desc: 'Quản lý danh sách ô kho vật lý, phân loại kích thước và kiểm soát trạng thái sẵn sàng.',
  },
  {
    to: '/manager/staff-schedule',
    icon: Users,
    label: 'Phân công Nhân sự',
    desc: 'Cân bằng tải nhân viên, điều phối bàn giao nhận kho, trả kho và niêm phong khóa ngoài.',
  },
  {
    to: '/manager/incidents',
    icon: Wrench,
    label: 'Xử lý Sự cố & Phiếu hỗ trợ',
    desc: 'Tiếp nhận khiếu nại, phân công nhân viên kiểm tra thực địa và xử lý kẹt khóa, thấm dột.',
  },
];

interface DashboardKpiSummary {
  availableUnits: number;
  pendingAllocation: number;
  todayAppointments: number;
  openIncidents: number;
}

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

export const ManagerDashboardPage: React.FC = () => {
  const [kpi, setKpi] = useState<DashboardKpiSummary>({
    availableUnits: 0,
    pendingAllocation: 0,
    todayAppointments: 0,
    openIncidents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date>(() => new Date());

  const loadSummary = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const facilities = await fetchMyAssignedFacilities();
      const assignedIds = new Set(facilities.map((f) => f.id));
      const todayIso = getLocalTodayIso(new Date());

      const [unitResults, reservationsResult, contractsResult, incidentsResult] =
        await Promise.allSettled([
          Promise.allSettled(
            facilities.map((f) => fetchStorageUnits(f.id, { status: 'AVAILABLE', size: 1 }))
          ),
          listReservations({ status: 'PAID', size: 100 }),
          getManagerContracts({ status: 'ALL' }),
          getManagementSupportRequests({}),
        ]);

      let availableUnits = 0;
      if (unitResults.status === 'fulfilled') {
        for (const res of unitResults.value) {
          if (res.status === 'fulfilled') {
            availableUnits += Number(res.value?.totalElements ?? 0);
          }
        }
      }

      let pendingAllocation = 0;
      if (reservationsResult.status === 'fulfilled') {
        pendingAllocation = reservationsResult.value.filter(
          (r) =>
            (assignedIds.size === 0 || assignedIds.has(r.facilityId)) &&
            !r.storageUnitId
        ).length;
      }

      let todayAppointments = 0;
      if (contractsResult.status === 'fulfilled') {
        todayAppointments = contractsResult.value.filter((c) => {
          if (assignedIds.size > 0 && c.facilityId && !assignedIds.has(c.facilityId)) {
            return false;
          }
          const st = String(c.status || '').toUpperCase();
          if (st === 'PENDING_CHECK_IN' || st === 'PENDING_CHECKIN') {
            return !c.startDate || String(c.startDate).slice(0, 10) === todayIso;
          }
          return st === 'PENDING_RETURN' || st === 'NOTICE_SUBMITTED';
        }).length;
      }

      let openIncidents = 0;
      if (incidentsResult.status === 'fulfilled') {
        openIncidents = incidentsResult.value.filter((t) => {
          if (assignedIds.size > 0 && t.facilityId && !assignedIds.has(t.facilityId)) {
            return false;
          }
          return t.status === 'OPEN' || t.status === 'IN_PROGRESS';
        }).length;
      }

      setKpi({
        availableUnits,
        pendingAllocation,
        todayAppointments,
        openIncidents,
      });
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

  const kpiCards = [
    {
      label: 'Ô kho trống',
      value: kpi.availableUnits,
      to: '/manager/facilities',
      valueClass: 'text-gray-900',
    },
    {
      label: 'Chờ gán ô kho',
      value: kpi.pendingAllocation,
      to: '/manager/allocation',
      valueClass: kpi.pendingAllocation > 0 ? 'text-amber-600' : 'text-gray-900',
    },
    {
      label: 'Lịch hẹn hôm nay',
      value: kpi.todayAppointments,
      to: '/manager/staff-schedule',
      valueClass: 'text-gray-900',
    },
    {
      label: 'Sự cố cần xử lý',
      value: kpi.openIncidents,
      to: '/manager/incidents',
      valueClass: kpi.openIncidents > 0 ? 'text-rose-600' : 'text-gray-900',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header phẳng, tối giản */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Cơ sở</h1>
          <p className="text-sm text-gray-500 mt-1 tabular-nums">
            Cập nhật lúc: {formatUpdatedTimestamp(updatedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadSummary(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Khối Thống kê trong ngày (KPI Summary) */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Tóm tắt trong ngày
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-white transition-colors block"
            >
              <p className="text-sm text-gray-500 mb-1">{item.label}</p>
              {loading ? (
                <div className="h-8 w-14 rounded bg-gray-200/80 animate-pulse" />
              ) : (
                <p className={`text-2xl font-bold tabular-nums ${item.valueClass}`}>
                  {item.value}
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Lưới Truy cập nhanh (Đơn sắc, không nền màu icon, không text lặp "Mở...") */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Truy cập nhanh
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {QUICK_ACCESS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-500 hover:shadow-sm transition-all group flex flex-col justify-between min-h-[152px]"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors shrink-0" />
                    <h3 className="font-bold text-gray-900 text-base group-hover:text-brand-700 transition-colors">
                      {card.label}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="w-full flex justify-end pt-3">
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
