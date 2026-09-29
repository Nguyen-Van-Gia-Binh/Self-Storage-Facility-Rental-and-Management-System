import React, { useEffect, useState, useMemo } from 'react';
import { Building2, Calendar, KeyRound, ClipboardCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { StaffDailyTaskReport } from '@/types';
import { getStaffDailyTasks } from '@/api/staff';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { DailyTasksOverview } from '../components/DailyTasksOverview';
import { useCurrentUser } from '@/utils/useCurrentUser';

export const StaffDashboardPage: React.FC = () => {
  const user = useCurrentUser();
  const staffId = user?.id as number | undefined;

  const [tasks, setTasks] = useState<StaffDailyTaskReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  // Danh sách cơ sở nhân viên phụ trách và cơ sở đang chọn lọc
  const [facilities, setFacilities] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(0);

  useEffect(() => {
    let active = true;
    fetchMyAssignedFacilities()
      .then((list) => {
        if (active && list && list.length > 0) {
          setFacilities([
            { id: 0, name: `Tất cả cơ sở phụ trách (${list.length})` },
            ...list.map((f) => ({ id: f.id, name: f.name })),
          ]);
        }
      })
      .catch((err) => {
        console.error('Không tải được danh sách cơ sở phân công:', err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!staffId) return;
    let ignore = false;
    getStaffDailyTasks(staffId, selectedDate)
      .then((data) => {
        if (!ignore) {
          setTasks(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi nạp danh sách công việc:', err);
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedDate, staffId]);

  const handleRefresh = async () => {
    if (!staffId) return;
    setLoading(true);
    try {
      const data = await getStaffDailyTasks(staffId, selectedDate);
      setTasks(data);
    } catch (err) {
      console.error('Lỗi khi làm mới danh sách công việc:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc công việc theo cơ sở được chọn (0 = Tất cả cơ sở)
  const filteredTasks = useMemo(() => {
    if (!tasks) return null;
    if (selectedFacilityId === 0) return tasks;
    return {
      ...tasks,
      pendingCheckIns: tasks.pendingCheckIns.filter((c) => Number(c.facilityId) === selectedFacilityId),
      pendingReturns: tasks.pendingReturns.filter((r) => Number(r.facilityId) === selectedFacilityId),
      openSupportRequests: tasks.openSupportRequests.filter((i) => Number(i.facilityId) === selectedFacilityId),
    };
  }, [tasks, selectedFacilityId]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 p-5 sm:p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #3b82f6 0%, transparent 50%)' }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-300 text-xs font-medium mb-1">Staff Desk · {now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{greeting}! 👋</h1>
            <p className="text-blue-200 text-xs mt-1">Chọn nghiệp vụ nhanh bên dưới hoặc xem lịch công việc ca trực hôm nay.</p>
          </div>
          {/* Quick Action Links */}
          <div className="flex gap-2.5 flex-shrink-0">
            <Link
              to="/staff/check-in"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-amber-500/30 transition-all duration-200 group"
            >
              <KeyRound className="w-4 h-4" />
              <span>Check-in kho</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/staff/return"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all duration-200 group"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Trả kho</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Shift Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Tổng Quan Ca Trực & Danh Mục Việc Trong Ngày
            </h1>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-medium border border-teal-200">
              SCR-FS-01 · FS-06
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi đón khách nhận kho, nghiệm thu trả kho và giải quyết sự cố thực địa tại cơ sở.
          </p>
        </div>

        {/* Facility Dropdown Selector & Date selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown chọn cơ sở */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
            <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {facilities.length > 0 ? (
                facilities.map((f) => (
                  <option key={f.id} value={f.id} className="text-slate-900 bg-white">
                    {f.name}
                  </option>
                ))
              ) : (
                <option value={0}>Tất cả cơ sở phụ trách</option>
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="outline-none text-xs font-medium cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Operational Tasks Body */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : filteredTasks ? (
        <DailyTasksOverview tasks={filteredTasks} onRefresh={handleRefresh} />
      ) : (
        <div className="p-8 text-center text-rose-500">
          Không thể tải dữ liệu ca trực. Vui lòng thử lại.
        </div>
      )}
    </div>
  );
};
