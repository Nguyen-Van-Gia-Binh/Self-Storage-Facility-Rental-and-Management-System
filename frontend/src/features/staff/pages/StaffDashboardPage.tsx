import React, { useEffect, useState } from 'react';
import { Building2, Calendar } from 'lucide-react';
import type { StaffDailyTaskReport } from '@/types';
import { getStaffDailyTasks } from '@/api/staff';
import { DailyTasksOverview } from '../components/DailyTasksOverview';

export const StaffDashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<StaffDailyTaskReport | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  const loadDailyTasks = async (date?: string) => {
    setLoading(true);
    try {
      const data = await getStaffDailyTasks(8, date || selectedDate);
      setTasks(data);
    } catch (err) {
      console.error('Lỗi khi nạp danh sách công việc:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyTasks(selectedDate);
  }, [selectedDate]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
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

        {/* Facility & Date selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>{tasks?.facilityName || 'Flagship Quận 7'}</span>
          </div>

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
        <div className="p-12 text-center text-slate-400">
          Đang nạp danh mục công việc trong ca trực...
        </div>
      ) : tasks ? (
        <DailyTasksOverview tasks={tasks} onRefresh={() => loadDailyTasks(selectedDate)} />
      ) : (
        <div className="p-8 text-center text-rose-500">
          Không thể tải dữ liệu ca trực. Vui lòng thử lại.
        </div>
      )}
    </div>
  );
};

