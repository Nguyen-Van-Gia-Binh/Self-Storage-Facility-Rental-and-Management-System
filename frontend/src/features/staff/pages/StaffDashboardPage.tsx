import React, { useEffect, useState, useMemo } from 'react';
import { Building2, Calendar, KeyRound, ClipboardCheck, ArrowRight, RotateCcw } from 'lucide-react';
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

  // State tìm kiếm nhanh theo tên khách, SĐT, mã ô kho, mã HĐ
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Shift Command Bar - Tinh gọn, hiện đại và tập trung thao tác */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Thông tin ca trực & Nhân viên */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {greeting}, {user?.fullName || 'Nhân viên'}! 👋
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Đang trong ca trực
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              {now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Theo dõi đón khách nhận kho, nghiệm thu trả kho và giải quyết sự cố.
            </p>
          </div>

          {/* Quick Action Buttons (Chuyển trang nghiệp vụ 1 chạm) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/staff/check-in"
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition group"
            >
              <KeyRound className="w-4 h-4" />
              <span>Tiếp đón Check-in</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/staff/return"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition group"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Nghiệm thu trả kho</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Bảng điều khiển bộ lọc & Tra cứu nhanh */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Ô tìm kiếm nhanh trên danh sách ca trực */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm nhanh: SĐT, Tên khách, Mã kho (A-102), Mã HĐ..."
              className="w-full pl-3.5 pr-8 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Cơ sở phụ trách, Ngày trực & Nút làm mới */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown chọn cơ sở */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-xs">
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
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 shadow-xs">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none text-xs font-medium cursor-pointer"
              />
            </div>

            {/* Nút làm mới */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              title="Làm mới dữ liệu ca trực"
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center justify-center transition disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            </button>
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
        <DailyTasksOverview
          tasks={filteredTasks}
          searchQuery={searchQuery}
          onRefresh={handleRefresh}
        />
      ) : (
        <div className="p-8 text-center text-rose-500 bg-white rounded-2xl border border-rose-100">
          Không thể tải dữ liệu ca trực. Vui lòng kiểm tra kết nối mạng và thử lại.
        </div>
      )}
    </div>
  );
};
