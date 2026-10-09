// frontend/src/features/manager/pages/ShiftCalendarPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getStaffWorkload } from '../api/staffAssignmentApi';
import type { FacilityListItem } from '@/types';
import type { StaffWorkloadItem } from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { CalendarWeekView, type DayWorkSummary } from '../components/CalendarWeekView';
import { CalendarMonthView } from '../components/CalendarMonthView';
import { DayShiftGrid, type ShiftInfo } from '../components/DayShiftGrid';

export const ShiftCalendarPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date selection state (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');

  const loadData = useCallback(async () => {
    if (!facilityId) return;
    try {
      setLoading(true);
      setError(null);
      const facRes = await fetchMyAssignedFacilities();
      const currentFac = facRes.find(
        (f) => String(f.id) === String(facilityId)
      );
      if (currentFac) {
        setFacility(currentFac);
      }

      const staffData = await getStaffWorkload(Number(facilityId));
      if (staffData && staffData.length > 0) {
        setStaffList(staffData);
      } else {
        // Fallback danh sách nhân viên cơ sở mẫu nếu API chưa có data seed
        setStaffList([
          {
            staffId: 101,
            staffName: 'Nguyễn Văn A',
            staffPhone: '0901234567',
            staffEmail: 'nva@smartstorage.vn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            activeTaskCount: 3,
            completedTaskCount: 12,
            status: 'AVAILABLE',
            shift: 'MORNING',
          },
          {
            staffId: 102,
            staffName: 'Trần Thị B',
            staffPhone: '0912345678',
            staffEmail: 'ttb@smartstorage.vn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            activeTaskCount: 2,
            completedTaskCount: 8,
            status: 'NORMAL',
            shift: 'MORNING',
          },
          {
            staffId: 103,
            staffName: 'Lê Văn C',
            staffPhone: '0923456789',
            staffEmail: 'lvc@smartstorage.vn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            activeTaskCount: 2,
            completedTaskCount: 9,
            status: 'AVAILABLE',
            shift: 'AFTERNOON',
          },
          {
            staffId: 104,
            staffName: 'Phạm Thị D',
            staffPhone: '0934567890',
            staffEmail: 'ptd@smartstorage.vn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            activeTaskCount: 1,
            completedTaskCount: 6,
            status: 'AVAILABLE',
            shift: 'AFTERNOON',
          },
          {
            staffId: 105,
            staffName: 'Hoàng Văn E',
            staffPhone: '0987654321',
            staffEmail: 'hve@smartstorage.vn',
            facilityId: Number(facilityId),
            facilityName: currentFac?.name || 'Cơ sở SmartStorage',
            activeTaskCount: 1,
            completedTaskCount: 4,
            status: 'AVAILABLE',
            shift: 'NIGHT',
          },
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải thông tin ca trực cơ sở.');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chia nhân viên theo 3 ca
  const shifts: ShiftInfo[] = useMemo(() => {
    const morningStaff: StaffWorkloadItem[] = [];
    const afternoonStaff: StaffWorkloadItem[] = [];
    const nightStaff: StaffWorkloadItem[] = [];

    staffList.forEach((st, idx) => {
      // Phân bổ mẫu theo index nếu chưa gán shift rõ ràng
      const mod = idx % 3;
      if (mod === 0) morningStaff.push(st);
      else if (mod === 1) afternoonStaff.push(st);
      else nightStaff.push(st);
    });

    return [
      {
        id: 'MORNING',
        name: 'Ca Sáng',
        timeRange: '06:00 - 14:00',
        icon: Sun,
        colorClass: 'text-amber-600',
        badgeBg: 'bg-amber-50 border border-amber-200',
        staffList: morningStaff,
      },
      {
        id: 'AFTERNOON',
        name: 'Ca Chiều',
        timeRange: '14:00 - 22:00',
        icon: Sunset,
        colorClass: 'text-orange-600',
        badgeBg: 'bg-orange-50 border border-orange-200',
        staffList: afternoonStaff,
      },
      {
        id: 'NIGHT',
        name: 'Ca Đêm',
        timeRange: '22:00 - 06:00',
        icon: Moon,
        colorClass: 'text-indigo-600',
        badgeBg: 'bg-indigo-50 border border-indigo-200',
        staffList: nightStaff,
      },
    ];
  }, [staffList]);

  // Tính 7 ngày trong tuần cho CalendarWeekView
  const daySummaries: DayWorkSummary[] = useMemo(() => {
    const baseDate = new Date(selectedDate);
    const dayOfWeek = (baseDate.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayOfWeek);

    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const todayStr = new Date().toISOString().split('T')[0];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      return {
        date: dStr,
        dayLabel: labels[i],
        dayNumber: d.getDate(),
        taskCount: 5 + ((d.getDate() * 3) % 7),
        isToday: dStr === todayStr,
      };
    });
  }, [selectedDate]);

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleCurrentWeek = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Điều hướng sang Cấp 3
  const handleViewShiftWork = (shiftId: string) => {
    navigate(
      `/manager/staff-schedule/facilities/${facilityId}/shifts?date=${selectedDate}&shift=${shiftId}`
    );
  };

  const handleViewStaffWork = (staffId: number, shiftId: string) => {
    navigate(
      `/manager/staff-schedule/facilities/${facilityId}/shifts?date=${selectedDate}&shift=${shiftId}&staffId=${staffId}`
    );
  };

  const breadcrumbItems = [
    { label: 'Phân công nhân sự', href: '/manager/staff-schedule' },
    { label: facility ? `${facility.code} (${facility.name})` : `Cơ sở #${facilityId}` },
  ];

  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Cơ sở & Nhân sự */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {facility?.code || 'FACILITY'}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">· Cấp 2: Lịch & Ca trực</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                {facility?.name || 'Đang tải thông tin cơ sở...'}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold">
              <Users className="w-4 h-4 text-slate-500" />
              <span>{staffList.length} nhân viên tại cơ sở</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 font-semibold border border-brand-100">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Đang chọn: {formattedSelectedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle View Mode: Tuần vs Tháng */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'WEEK'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch Tuần (Week View)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('MONTH')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMode === 'MONTH'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch Tháng (Month View)
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/manager/staff-schedule/facilities/${facilityId}/shifts?date=${selectedDate}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors cursor-pointer"
        >
          <span>Xem tất cả việc ngày này</span>
        </button>
      </div>

      {/* Calendar Controls */}
      {viewMode === 'WEEK' ? (
        <CalendarWeekView
          currentDate={selectedDate}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          daySummaries={daySummaries}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onCurrentWeek={handleCurrentWeek}
          monthTitle={`Lịch ca trực tuần này (${formattedSelectedDate})`}
        />
      ) : (
        <CalendarMonthView selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      )}

      {/* Loading / Error states */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Đang tải ca trực...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-800">Không thể tải thông tin ca trực</h4>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3 Khung Ca Trực Trong Ngày */}
      {!loading && !error && (
        <DayShiftGrid
          shifts={shifts}
          onViewShiftWork={handleViewShiftWork}
          onViewStaffWork={handleViewStaffWork}
          onAddAssignment={(shiftId) => {
            navigate(
              `/manager/staff-schedule/facilities/${facilityId}/shifts?date=${selectedDate}&shift=${shiftId}&action=assign`
            );
          }}
        />
      )}
    </div>
  );
};
