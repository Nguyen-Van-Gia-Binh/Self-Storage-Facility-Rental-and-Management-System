import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Calendar, RotateCcw } from 'lucide-react';
import type { StaffDailyTaskReport } from '@/types';
import { getStaffDailyTasks } from '@/api/staff';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { DailyTasksOverview } from '../components/DailyTasksOverview';
import { useCurrentUser } from '@/utils/useCurrentUser';

export const StaffDashboardPage: React.FC = () => {
  const user = useCurrentUser();
  const staffId = user?.id as number | undefined;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialFacilityId = Number(searchParams.get('facilityId')) || 0;

  const [tasks, setTasks] = useState<StaffDailyTaskReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [loading, setLoading] = useState(true);

  // Danh sách cơ sở nhân viên phụ trách và cơ sở đang chọn lọc
  const [facilities, setFacilities] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(initialFacilityId);

  // Đồng bộ searchParams khi chọn ngày hoặc cơ sở để giữ tiến độ ca trực
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('date', newDate);
      return next;
    }, { replace: true });
  };

  const handleFacilityChange = (newFacId: number) => {
    setSelectedFacilityId(newFacId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('facilityId', String(newFacId));
      return next;
    }, { replace: true });
  };

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
      {/* Shift Command Bar - Tinh gọn, hiện đại, loại bỏ nút trùng lặp */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <span>Phiên trực lễ tân / thực địa</span>
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
                onChange={(e) => handleFacilityChange(Number(e.target.value))}
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
                onChange={(e) => handleDateChange(e.target.value)}
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
      {loading && !filteredTasks ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
      ) : filteredTasks ? (
        <DailyTasksOverview
          tasks={filteredTasks}
          searchQuery={searchQuery}
          selectedDate={selectedDate}
          selectedFacilityId={selectedFacilityId}
          onRefresh={handleRefresh}
          onDateChange={handleDateChange}
          loading={loading}
        />
      ) : (
        <div className="p-8 text-center text-rose-500 bg-white rounded-2xl border border-rose-100">
          Không thể tải dữ liệu ca trực. Vui lòng kiểm tra kết nối mạng và thử lại.
        </div>
      )}
    </div>
  );
};
