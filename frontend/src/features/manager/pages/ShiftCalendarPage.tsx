// frontend/src/features/manager/pages/ShiftCalendarPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Building2,
  RefreshCw,
  AlertCircle,
  Inbox,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { DateField } from '@/components/ui/DateField';
import {
  getStaffWorkload,
  getDailyDispatchTasks,
  assignStaffToTask,
  filterDispatchTasksByDate,
  enrichStaffListWithTasks,
} from '../api/staffAssignmentApi';
import type { FacilityListItem } from '@/types';
import type { StaffWorkloadItem, DailyDispatchTaskItem, AssignTaskPayload } from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { WorkItemCard } from '../components/WorkItemCard';
import { AssignStaffModal } from '../components/AssignStaffModal';

export type TaskTabFilter =
  | 'ALL'
  | 'UNASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CHECK_IN'
  | 'RETURN'
  | 'INCIDENT';
export type MainViewTab = 'TASKS' | 'STAFF';

export const ShiftCalendarPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab chính: TASKS (Điều phối việc theo ngày) hoặc STAFF (Đội ngũ nhân sự cơ sở)
  const [mainTab, setMainTab] = useState<MainViewTab>(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'staff' ? 'STAFF' : 'TASKS';
  });

  // Bộ chọn ngày (mặc định là hôm nay YYYY-MM-DD theo múi giờ địa phương)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return searchParams.get('date') || todayStr;
  });

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [allTasks, setAllTasks] = useState<DailyDispatchTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters cho Tab Công việc
  const [taskFilter, setTaskFilter] = useState<TaskTabFilter>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Nhân viên đang xem chi tiết ở Tab Nhân sự (Drill-down)
  const [viewingStaffDetail, setViewingStaffDetail] = useState<StaffWorkloadItem | null>(null);

  // Modal Phân công nhân viên
  const [assigningTask, setAssigningTask] = useState<DailyDispatchTaskItem | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!facilityId) return;
    try {
      if (isSilent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [facRes, staffData, taskData] = await Promise.all([
        fetchMyAssignedFacilities().catch(() => []),
        getStaffWorkload(Number(facilityId)).catch(() => []),
        getDailyDispatchTasks(Number(facilityId), selectedDate).catch(() => []),
      ]);

      const currentFac = facRes.find((f) => String(f.id) === String(facilityId));
      if (currentFac) {
        setFacility(currentFac);
      }

      const enrichedStaff = enrichStaffListWithTasks(staffData || [], taskData || []);
      setStaffList(enrichedStaff);
      setAllTasks(taskData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải thông tin cơ sở và nhiệm vụ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [facilityId, selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Đồng bộ searchParams khi đổi tab hoặc đổi date
  const handleTabChange = (tab: MainViewTab) => {
    setMainTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === 'STAFF') next.set('tab', 'staff');
      else next.delete('tab');
      return next;
    });
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newDate !== todayStr) next.set('date', newDate);
      else next.delete('date');
      return next;
    });
  };

  // Nút chuyển ngày nhanh
  const shiftDay = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const cur = new Date(y, m - 1, d + days);
    const nextStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    handleDateChange(nextStr);
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-');
      const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
      const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = dayNames[dateObj.getDay()];
      return `${dayName}, ${d}/${m}/${y}`;
    } catch {
      return dStr;
    }
  };

  // Lọc nhiệm vụ theo ngày tạo đơn/phiếu yêu cầu:
  // Hiển thị các nhiệm vụ được tạo trong ngày đang chọn VÀ các nhiệm vụ tạo trong quá khứ nhưng chưa thực hiện hoàn tất
  const dailyTasks = useMemo(() => {
    return filterDispatchTasksByDate(allTasks, selectedDate);
  }, [allTasks, selectedDate]);

  // Thống kê nhanh công việc trong ngày
  const dailyStats = useMemo(() => {
    const isTaskAssigned = (t: DailyDispatchTaskItem) =>
      Boolean(t.assignedStaffId || t.assignedStaffName);
    const isTaskCompleted = (t: DailyDispatchTaskItem) =>
      t.status === 'COMPLETED' || t.status === 'RESOLVED';

    const total = dailyTasks.length;
    const unassigned = dailyTasks.filter(
      (t) => !isTaskCompleted(t) && (t.status === 'UNASSIGNED' || !isTaskAssigned(t))
    ).length;
    const inProgress = dailyTasks.filter(
      (t) => !isTaskCompleted(t) && isTaskAssigned(t) && t.status !== 'UNASSIGNED'
    ).length;
    const completed = dailyTasks.filter(isTaskCompleted).length;

    const checkIns = dailyTasks.filter((t) => t.taskType === 'CHECK_IN').length;
    const returns = dailyTasks.filter((t) => t.taskType === 'RETURN').length;
    const incidents = dailyTasks.filter((t) => t.taskType === 'INCIDENT').length;

    return { total, unassigned, inProgress, completed, checkIns, returns, incidents };
  }, [dailyTasks]);

  // Bộ lọc danh sách nhiệm vụ hiển thị
  const filteredDailyTasks = useMemo(() => {
    return dailyTasks.filter((t) => {
      const isCompleted = t.status === 'COMPLETED' || t.status === 'RESOLVED';
      const isAssigned = Boolean(t.assignedStaffId || t.assignedStaffName);

      // Lọc theo loại việc / trạng thái
      if (taskFilter === 'UNASSIGNED' && (isCompleted || (t.status !== 'UNASSIGNED' && isAssigned))) {
        return false;
      }
      if (taskFilter === 'IN_PROGRESS' && (isCompleted || !isAssigned || t.status === 'UNASSIGNED')) {
        return false;
      }
      if (taskFilter === 'COMPLETED' && !isCompleted) {
        return false;
      }
      if (taskFilter === 'CHECK_IN' && t.taskType !== 'CHECK_IN') return false;
      if (taskFilter === 'RETURN' && t.taskType !== 'RETURN') return false;
      if (taskFilter === 'INCIDENT' && t.taskType !== 'INCIDENT') return false;

      // Lọc theo nhân viên phụ trách
      if (selectedStaffFilter !== 'ALL' && t.assignedStaffId !== selectedStaffFilter) {
        return false;
      }

      // Tìm kiếm từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCustomer = t.customerName.toLowerCase().includes(q);
        const matchUnit = (t.unitCode || '').toLowerCase().includes(q);
        const matchRef = (t.referenceCode || '').toLowerCase().includes(q);
        const matchStaff = (t.assignedStaffName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCustomer && !matchUnit && !matchRef && !matchStaff) {
          return false;
        }
      }

      return true;
    });
  }, [dailyTasks, taskFilter, selectedStaffFilter, searchQuery]);

  // Mở modal phân công
  const handleOpenAssignModal = (task: DailyDispatchTaskItem) => {
    setAssigningTask(task);
    setIsAssignModalOpen(true);
  };

  // Xác nhận phân công qua API
  const handleConfirmAssign = async (payload: AssignTaskPayload) => {
    try {
      const res = await assignStaffToTask(payload);
      showToast(res.message || 'Phân công nhân viên thực hiện nhiệm vụ thành công!');
      await loadData(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi phân công nhân viên.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleViewTaskDetail = (taskId: number) => {
    navigate(`/manager/staff-schedule/assignments/${taskId}?facilityId=${facilityId}`);
  };

  const breadcrumbItems = [
    { label: 'Phân công nhân sự', href: '/manager/staff-schedule' },
    { label: facility ? `${facility.code} (${facility.name})` : `Cơ sở #${facilityId}` },
  ];

  return (
    <div className="space-y-6">
      {/* Toast thông báo nổi */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header Cơ sở & Bộ điều khiển ngày */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {facility?.code || 'FACILITY'}
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                {facility?.name || 'Đang tải thông tin cơ sở...'}
              </h1>
              {facility?.address && (
                <p className="text-xs text-slate-500 mt-0.5">{facility.address}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Bộ chọn ngày (Date Picker & Quick Buttons) */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                title="Ngày hôm trước"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleDateChange(todayStr)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-brand-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:bg-white'
                }`}
              >
                Hôm nay
              </button>

              <DateField
                value={selectedDate}
                onChange={handleDateChange}
                className="w-32 pl-2.5 py-1 bg-white rounded-lg border border-slate-200/80 text-xs font-semibold text-slate-800 tabular-nums outline-none focus:border-brand-500"
              />

              <button
                type="button"
                onClick={() => shiftDay(1)}
                title="Ngày tiếp theo"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>

        {/* 2 Tabs Chuyển đổi dạng gạch chân (Underline Tabs) */}
        <div className="border-b border-gray-200 mt-5 -mx-5 px-5">
          <nav className="-mb-px flex space-x-6" aria-label="Điều hướng phân công nhân sự">
            <button
              type="button"
              onClick={() => handleTabChange('TASKS')}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors cursor-pointer ${
                mainTab === 'TASKS'
                  ? 'border-brand-500 text-brand-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Điều phối công việc</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('STAFF')}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 text-sm transition-colors cursor-pointer ${
                mainTab === 'STAFF'
                  ? 'border-brand-500 text-brand-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Đội ngũ nhân sự</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs tabular-nums ${
                  mainTab === 'STAFF'
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {staffList.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ĐIỀU PHỐI CÔNG VIỆC THEO NGÀY                                      */}
      {/* ========================================================================= */}
      {mainTab === 'TASKS' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Bảng Danh sách Nhiệm vụ Ngày */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4">
            {/* Header Bảng & Tìm kiếm */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-gray-900">
                Hàng đợi công việc ngày {formatDisplayDate(selectedDate)}
              </h2>

              <div className="flex flex-wrap items-center gap-2">
                {/* Lọc theo nhân viên */}
                <select
                  value={selectedStaffFilter}
                  onChange={(e) =>
                    setSelectedStaffFilter(
                      e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                    )
                  }
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 text-gray-700 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Tất cả nhân viên phụ trách</option>
                  {staffList.map((st) => (
                    <option key={st.staffId} value={st.staffId}>
                      {st.staffName} ({st.activeTaskCount || 0} việc)
                    </option>
                  ))}
                </select>

                {/* Ô tìm kiếm */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo kho, khách, mã..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/70 focus:bg-white focus:border-brand-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bộ lọc trạng thái & loại công việc (Tĩnh lặng, đồng nhất màu sắc) */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
              {(
                [
                  ['ALL', `Tất cả (${dailyStats.total})`],
                  ['UNASSIGNED', `Chờ phân công (${dailyStats.unassigned})`],
                  ['IN_PROGRESS', `Đang thực hiện (${dailyStats.inProgress})`],
                  ['COMPLETED', `Đã hoàn thành (${dailyStats.completed})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTaskFilter(key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    taskFilter === key
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}

              <span className="h-4 w-px bg-gray-200 mx-1 hidden sm:inline-block" />

              {(
                [
                  ['CHECK_IN', `Check-in (${dailyStats.checkIns})`],
                  ['RETURN', `Trả kho (${dailyStats.returns})`],
                  ['INCIDENT', `Sự cố (${dailyStats.incidents})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTaskFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
                    taskFilter === key
                      ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Trạng thái tải / lỗi */}
            {loading && (
              <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mb-2" />
                <p className="text-xs font-medium">Đang tải danh sách công việc...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-rose-800">Không thể tải thông tin công việc</h4>
                  <p className="text-xs text-rose-600 mt-0.5">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadData()}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 cursor-pointer"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Danh sách nhiệm vụ ngày */}
            {!loading && !error && (
              <div className="space-y-3">
                {filteredDailyTasks.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <Inbox className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.</p>
                  </div>
                ) : (
                  filteredDailyTasks.map((t) => (
                    <WorkItemCard
                      key={t.id}
                      task={t}
                      onViewDetails={handleViewTaskDetail}
                      onAssign={handleOpenAssignModal}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ĐỘI NGŨ NHÂN SỰ CƠ SỞ (DẠNG DATA TABLE GỌN GÀNG)                   */}
      {/* ========================================================================= */}
      {mainTab === 'STAFF' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Đội ngũ nhân sự {facility?.name || 'Cơ sở'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold tabular-nums">
                  {staffList.length} nhân viên
                </span>
              </h2>

              {viewingStaffDetail && (
                <button
                  type="button"
                  onClick={() => setViewingStaffDetail(null)}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg self-start cursor-pointer transition-colors"
                >
                  ✕ Đóng chi tiết
                </button>
              )}
            </div>

            {/* Bảng Đội ngũ Nhân sự (Data Table thay cho Card Grid) */}
            {staffList.length === 0 ? (
              <div className="p-6">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                  <Inbox className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-sm text-gray-500">Chưa có nhân viên nào được phân bổ vào cơ sở này.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Nhân viên
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Công việc (Đang làm / Xong)
                      </th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {staffList.map((st) => {
                      const isSelected = viewingStaffDetail?.staffId === st.staffId;
                      const activeCount = st.activeTaskCount || 0;
                      const completedCount = st.completedTaskCount || 0;
                      const isBusy = activeCount > 0;

                      return (
                        <tr
                          key={st.staffId}
                          className={`transition-colors ${
                            isSelected ? 'bg-brand-50/40' : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {st.staffName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-gray-900">{st.staffName}</p>
                                <p className="text-xs text-gray-500">
                                  {st.staffPhone || 'Chưa cập nhật'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isBusy ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Đang trực
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded border border-gray-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Sẵn sàng
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm tabular-nums">
                            <span className="font-bold text-gray-900">{activeCount}</span>{' '}
                            <span className="text-gray-500">đang làm</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className="font-bold text-gray-900">{completedCount}</span>{' '}
                            <span className="text-gray-500">hoàn thành</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setViewingStaffDetail(isSelected ? null : st)}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
                                isSelected
                                  ? 'bg-brand-50 text-brand-700 border-brand-300 font-semibold'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {isSelected ? 'Đang xem' : 'Xem việc'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Drill-down: Danh sách việc của nhân viên đang chọn (Empty State thu gọn) */}
          {viewingStaffDetail && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                    {viewingStaffDetail.staffName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">
                      Nhiệm vụ của: {viewingStaffDetail.staffName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {viewingStaffDetail.staffPhone}
                      {viewingStaffDetail.staffEmail ? ` · ${viewingStaffDetail.staffEmail}` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingStaffDetail(null)}
                  className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>

              {allTasks.filter((t) => t.assignedStaffId === viewingStaffDetail.staffId).length ===
              0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-center justify-center gap-2.5 text-sm text-gray-500">
                  <Inbox className="w-5 h-5 text-gray-400 shrink-0" />
                  <span>Chưa có nhiệm vụ nào được giao cho nhân viên này.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTasks
                    .filter((t) => t.assignedStaffId === viewingStaffDetail.staffId)
                    .map((t) => (
                      <WorkItemCard
                        key={t.id}
                        task={t}
                        onViewDetails={handleViewTaskDetail}
                        onAssign={handleOpenAssignModal}
                      />
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Phân công nhân viên trực tiếp */}
      <AssignStaffModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningTask(null);
        }}
        task={assigningTask}
        staffList={staffList}
        onAssign={handleConfirmAssign}
      />
    </div>
  );
};
