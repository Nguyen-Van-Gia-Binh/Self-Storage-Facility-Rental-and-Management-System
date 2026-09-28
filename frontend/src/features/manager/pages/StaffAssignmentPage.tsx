import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import type {
  StaffWorkloadItem,
  DailyDispatchTaskItem,
  AssignTaskPayload,
} from '../types/staffAssignment';
import {
  getStaffWorkload,
  getDailyDispatchTasks,
  assignStaffToTask,
} from '../api/staffAssignmentApi';
import { StaffWorkloadCard } from '../components/StaffWorkloadCard';
import { DailyTasksDispatchBoard } from '../components/DailyTasksDispatchBoard';
import { AssignStaffModal } from '../components/AssignStaffModal';
import { StaffDailyScheduleModal } from '../components/StaffDailyScheduleModal';
import { fetchFacilities } from '@/api/facility';
import { tokenStorage } from '@/utils/tokenStorage';

export const StaffAssignmentPage: React.FC = () => {
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(() => {
    const user = tokenStorage.getUser();
    return user?.facilityId ? Number(user.facilityId) : 1;
  });
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [tasks, setTasks] = useState<DailyDispatchTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bộ lọc theo nhân sự khi click từ Card
  const [filteredStaffId, setFilteredStaffId] = useState<number | null>(null);

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] =
    useState<DailyDispatchTaskItem | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState<boolean>(false);
  const [selectedStaffForSchedule, setSelectedStaffForSchedule] =
    useState<StaffWorkloadItem | null>(null);

  const [reloadKey, setReloadKey] = useState<number>(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetchFacilities(undefined, true)
      .then((list) => {
        if (list && list.length > 0) {
          const mapped = list.map((f) => ({ id: f.id, name: f.name }));
          setFacilities(mapped);
          setSelectedFacilityId((current) => {
            if (mapped.some((f) => f.id === current)) return current;
            return mapped[0].id;
          });
        }
      })
      .catch((err) => console.warn('Lỗi tải danh mục cơ sở:', err));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const [workloadRes, tasksRes] = await Promise.all([
          getStaffWorkload(selectedFacilityId),
          getDailyDispatchTasks(selectedFacilityId, selectedDate),
        ]);
        if (isMounted) {
          setStaffList(workloadRes);
          setTasks(tasksRes);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu phân công nhân sự:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedFacilityId, selectedDate, reloadKey]);

  // Xử lý phân công / điều chuyển nhân viên
  const handleAssignTask = async (payload: AssignTaskPayload) => {
    const res = await assignStaffToTask(payload);
    showToast(res.message);

    // Cập nhật lại danh sách tasks cục bộ
    setTasks((prev) =>
      prev.map((t) => (t.id === res.updatedTask.id ? res.updatedTask : t))
    );
    // Kích hoạt nạp lại để đồng bộ tải công việc
    setReloadKey((k) => k + 1);
  };

  // Mở modal phân công
  const handleOpenAssignModal = (task: DailyDispatchTaskItem) => {
    setSelectedTaskForAssign(task);
    setAssignModalOpen(true);
  };

  // Mở modal lịch trình ca trực của nhân viên
  const handleOpenScheduleModal = (staff: StaffWorkloadItem) => {
    setSelectedStaffForSchedule(staff);
    setScheduleModalOpen(true);
  };

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const totalStaff = staffList.length;
    const overloadedStaff = staffList.filter((s) => s.status === 'OVERLOADED').length;
    const availableStaff = staffList.filter((s) => s.status === 'AVAILABLE').length;

    const totalTasks = tasks.length;
    const unassignedTasks = tasks.filter((t) => t.status === 'UNASSIGNED').length;
    const assignedTasks = tasks.filter((t) => t.status !== 'UNASSIGNED').length;
    const urgentTasks = tasks.filter((t) => t.isUrgent).length;

    return {
      totalStaff,
      overloadedStaff,
      availableStaff,
      totalTasks,
      unassignedTasks,
      assignedTasks,
      urgentTasks,
    };
  }, [staffList, tasks]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Phân công Nhân sự & Điều phối Vận hành
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-100 text-blue-700">
              SCR-FM-03
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cân bằng tải ca trực, phân bổ nhiệm vụ Bàn giao Check-in, Trả kho, Sự cố khẩn cấp và
            Khóa ngoài Overlock (FM-05)
          </p>
        </div>

        {/* Toolbar: Facility & Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Nhân sự trực ca */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nhân sự trực ca</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalStaff}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">
              ({stats.availableStaff} sẵn sàng)
            </span>
          </div>
          {stats.overloadedStaff > 0 && (
            <p className="text-[11px] text-rose-600 font-medium mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{stats.overloadedStaff} nhân viên đang quá tải (≥5 việc)</span>
            </p>
          )}
        </div>

        {/* KPI 2: Tổng nhiệm vụ trong ngày */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng nhiệm vụ hôm nay</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalTasks}</span>
            <span className="text-[11px] text-slate-400">việc thực địa</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Check-in, Trả kho, Sự cố & Niêm phong
          </p>
        </div>

        {/* KPI 3: Chưa phân công */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Chờ phân công</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{stats.unassignedTasks}</span>
            <span className="text-[11px] text-rose-600 font-semibold">cần chỉ định ngay</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1">
            Ưu tiên phân bổ cho nhân sự có tải việc nhẹ
          </p>
        </div>

        {/* KPI 4: Sự cố khẩn cấp SLA 2h */}
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Sự cố khẩn cấp SLA 2h</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">{stats.urgentTasks}</span>
            <span className="text-[11px] text-amber-700 font-semibold">cam kết BR-SUP-01</span>
          </div>
          <p className="text-[11px] text-amber-700 mt-1">
            Xử lý kịp thời tránh vi phạm thỏa thuận
          </p>
        </div>
      </div>

      {/* Staff Workload Balancing Section (US-FM-05.1 AC-3) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Khối lượng Công việc Nhân sự tại Cơ sở (Cân bằng tải AC-3)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Quan sát số việc đang phụ trách để san sẻ đồng đều, tránh giao dồn việc cho một người
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Rảnh (0-2)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Bình thường (3-4)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Quá tải (≥5)
            </span>
          </div>
        </div>

        {/* Grid thẻ nhân viên */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {staffList.map((staff) => (
            <StaffWorkloadCard
              key={staff.staffId}
              staff={staff}
              isSelected={filteredStaffId === staff.staffId}
              onSelectForFilter={(staffId) => setFilteredStaffId(staffId)}
              onViewSchedule={handleOpenScheduleModal}
            />
          ))}
        </div>
      </div>

      {/* Operations Task Dispatch Board */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-600" />
            <span>Bàn Điều phối Nhiệm vụ Thực địa trong ngày</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Phân công và điều chuyển nhân viên cho các lượt hẹn Check-in, Return, Sự cố và Khóa
            ngoài (AC-1, AC-4)
          </p>
        </div>

        <DailyTasksDispatchBoard
          tasks={tasks}
          selectedStaffIdFilter={filteredStaffId}
          onClearStaffFilter={() => setFilteredStaffId(null)}
          onAssignClick={handleOpenAssignModal}
        />
      </div>

      {/* Modals */}
      <AssignStaffModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        task={selectedTaskForAssign}
        staffList={staffList}
        onAssign={handleAssignTask}
      />

      <StaffDailyScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        staff={selectedStaffForSchedule}
      />
    </div>
  );
};
