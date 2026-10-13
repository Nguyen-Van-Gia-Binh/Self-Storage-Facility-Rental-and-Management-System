// frontend/src/features/manager/pages/ShiftCalendarPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Building2,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Check,
  Phone,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  UserCheck,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getStaffWorkload, getDailyDispatchTasks, assignStaffToTask } from '../api/staffAssignmentApi';
import { fetchActivePolicy } from '@/api/pricing';
import type { FacilityListItem } from '@/types';
import type { StaffWorkloadItem, DailyDispatchTaskItem, AssignTaskPayload } from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { WorkItemCard } from '../components/WorkItemCard';
import { AssignStaffModal } from '../components/AssignStaffModal';

export type TaskTabFilter = 'ALL' | 'UNASSIGNED' | 'CHECK_IN' | 'RETURN' | 'INCIDENT';
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

  // Bộ chọn ngày (mặc định là hôm nay YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return searchParams.get('date') || todayStr;
  });

  // Số ngày ân hạn nhận kho theo chính sách BOM (BR-CHK-05, mặc định 3 ngày nếu đã cấu hình)
  const [policyGraceDays, setPolicyGraceDays] = useState<number>(3);

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
  const [includeBacklogUnassigned, setIncludeBacklogUnassigned] = useState<boolean>(true);

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

      const [facRes, staffData, taskData, activePolicy] = await Promise.all([
        fetchMyAssignedFacilities().catch(() => []),
        getStaffWorkload(Number(facilityId)).catch(() => []),
        getDailyDispatchTasks(Number(facilityId), selectedDate).catch(() => []),
        fetchActivePolicy().catch(() => null),
      ]);

      if (activePolicy && typeof activePolicy.checkinGraceDays === 'number') {
        setPolicyGraceDays(activePolicy.checkinGraceDays);
      }

      const currentFac = facRes.find((f) => String(f.id) === String(facilityId));
      if (currentFac) {
        setFacility(currentFac);
      }

      setStaffList(staffData || []);
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
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    handleDateChange(cur.toISOString().split('T')[0]);
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

  // Lọc nhiệm vụ thuộc ngày đang chọn (và đơn Check-in trong thời hạn ân hạn 10 ngày BR-CHK-05)
  const dailyTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // 1. Task chính xác của ngày được chọn
      if (t.scheduledDate === selectedDate) return true;

      // 2. BR-CHK-05: Đơn Check-in chưa hoàn thành được phép nhận kho trễ tối đa số ngày ân hạn từ ngày bắt đầu thuê (đồng bộ BOM Policy)
      if (t.taskType === 'CHECK_IN' && t.status !== 'COMPLETED' && t.scheduledDate) {
        const startParts = t.scheduledDate.split('-').map(Number);
        const targetParts = selectedDate.split('-').map(Number);
        if (startParts.length === 3 && targetParts.length === 3) {
          const startUtc = Date.UTC(startParts[0], startParts[1] - 1, startParts[2]);
          const targetUtc = Date.UTC(targetParts[0], targetParts[1] - 1, targetParts[2]);
          const diffDays = Math.round((targetUtc - startUtc) / (1000 * 60 * 60 * 24));
          const effectiveGraceDays = t.checkinGraceDays ?? policyGraceDays ?? 3;
          if (diffDays >= 0 && diffDays <= effectiveGraceDays) {
            return true;
          }
        }
      }

      // 3. Nếu đang xem ngày hôm nay và bật cờ bao gồm việc chưa gán:
      if (
        includeBacklogUnassigned &&
        selectedDate === todayStr &&
        (t.status === 'UNASSIGNED' || !t.assignedStaffId) &&
        t.scheduledDate &&
        t.scheduledDate <= selectedDate
      ) {
        return true;
      }

      return false;
    });
  }, [allTasks, selectedDate, todayStr, includeBacklogUnassigned, policyGraceDays]);

  // Thống kê nhanh công việc trong ngày
  const dailyStats = useMemo(() => {
    const total = dailyTasks.length;
    const unassigned = dailyTasks.filter((t) => t.status === 'UNASSIGNED' || !t.assignedStaffId).length;
    const inProgress = dailyTasks.filter(
      (t) => (t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') && t.assignedStaffId
    ).length;
    const completed = dailyTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'RESOLVED').length;

    const checkIns = dailyTasks.filter((t) => t.taskType === 'CHECK_IN').length;
    const returns = dailyTasks.filter((t) => t.taskType === 'RETURN').length;
    const incidents = dailyTasks.filter((t) => t.taskType === 'INCIDENT').length;

    return { total, unassigned, inProgress, completed, checkIns, returns, incidents };
  }, [dailyTasks]);

  // Bộ lọc danh sách nhiệm vụ hiển thị
  const filteredDailyTasks = useMemo(() => {
    return dailyTasks.filter((t) => {
      // Lọc theo loại việc / trạng thái
      if (taskFilter === 'UNASSIGNED' && t.status !== 'UNASSIGNED' && Boolean(t.assignedStaffId)) {
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
                <span className="text-[11px] font-semibold text-slate-400">
                  · Quản lý & Điều phối Nhân sự
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

              <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-slate-200/80 text-xs font-bold text-slate-800">
                <CalendarIcon className="w-3.5 h-3.5 text-brand-600" />
                <span>{formatDisplayDate(selectedDate)}</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="opacity-0 absolute w-6 cursor-pointer"
                />
              </div>

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

        {/* 2 Tabs Chuyển đổi Cấp độ (Tránh dồn ép giao diện) */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => handleTabChange('TASKS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mainTab === 'TASKS'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>1. Điều phối công việc trong ngày ({dailyTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('STAFF')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mainTab === 'STAFF'
                ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Đội ngũ nhân sự cơ sở ({staffList.length} nhân viên)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ĐIỀU PHỐI CÔNG VIỆC THEO NGÀY (CHÍNH - TẬP TRUNG GIAO VIỆC)      */}
      {/* ========================================================================= */}
      {mainTab === 'TASKS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Thẻ KPI Chỉ số Công việc Ngày này */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Nhiệm vụ ngày</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{dailyStats.total}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Check-in, trả kho, sự cố</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div
              onClick={() => setTaskFilter('UNASSIGNED')}
              className={`bg-white rounded-2xl border shadow-2xs p-4 flex items-center justify-between cursor-pointer transition-all ${
                taskFilter === 'UNASSIGNED'
                  ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/40'
                  : 'border-slate-200/90 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-amber-700">Chờ phân công</p>
                  {dailyStats.unassigned > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-2xl font-bold text-amber-600 mt-1">{dailyStats.unassigned}</p>
                <p className="text-[11px] text-amber-600/80 mt-0.5">Cần gán nhân viên phụ trách</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-700">Đang thực hiện</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{dailyStats.inProgress}</p>
                <p className="text-[11px] text-blue-500 mt-0.5">Đã phân công cho nhân viên</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700">Đã hoàn thành</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{dailyStats.completed}</p>
                <p className="text-[11px] text-emerald-600/80 mt-0.5">Nghiệm thu & bàn giao xong</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Bảng Danh sách Nhiệm vụ Ngày */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
            {/* Header Bảng & Tìm kiếm */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Hàng đợi công việc ngày {formatDisplayDate(selectedDate)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200/80">
                    {filteredDailyTasks.length} việc
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đón tiếp khách nhận kho (ân hạn tối đa {policyGraceDays} ngày theo chính sách BOM), kiểm tra trả kho và sửa chữa sự cố kỹ thuật theo ngày.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Lọc theo nhân viên */}
                <select
                  value={selectedStaffFilter}
                  onChange={(e) =>
                    setSelectedStaffFilter(
                      e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
                    )
                  }
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden cursor-pointer"
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
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo kho, khách, mã..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Tab Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTaskFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    taskFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({dailyStats.total})
                </button>

                <button
                  type="button"
                  onClick={() => setTaskFilter('UNASSIGNED')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    taskFilter === 'UNASSIGNED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                  }`}
                >
                  <span>Chờ phân công</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      taskFilter === 'UNASSIGNED' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-900'
                    }`}
                  >
                    {dailyStats.unassigned}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaskFilter('CHECK_IN')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    taskFilter === 'CHECK_IN'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  Check-in nhận kho ({dailyStats.checkIns})
                </button>

                <button
                  type="button"
                  onClick={() => setTaskFilter('RETURN')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    taskFilter === 'RETURN'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
                  }`}
                >
                  Nghiệm thu trả kho ({dailyStats.returns})
                </button>

                <button
                  type="button"
                  onClick={() => setTaskFilter('INCIDENT')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    taskFilter === 'INCIDENT'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  Sự cố kỹ thuật ({dailyStats.incidents})
                </button>
              </div>

              {/* Tùy chọn gộp việc tồn đọng */}
              {selectedDate === todayStr && (
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeBacklogUnassigned}
                    onChange={(e) => setIncludeBacklogUnassigned(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Gộp cả đơn chưa gán từ các ngày trước</span>
                </label>
              )}
            </div>

            {/* Trạng thái tải / lỗi */}
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
                <p className="text-xs font-semibold">Đang tải danh sách công việc...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
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
                  <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">Không có nhiệm vụ nào trong ngày này</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Cơ sở chưa có lịch hẹn tiếp đón hoặc sự cố cần xử lý vào ngày {formatDisplayDate(selectedDate)}.
                    </p>
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
      {/* TAB 2: ĐỘI NGŨ NHÂN SỰ CƠ SỞ (TÁCH RIÊNG ĐỂ TRÁNH LOÃNG GIAO DIỆN)        */}
      {/* ========================================================================= */}
      {mainTab === 'STAFF' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" />
                  <span>Danh sách Đội ngũ Nhân sự Cơ sở</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {staffList.length} nhân viên
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Theo dõi trạng thái, năng suất và phân bổ đều khối lượng công việc thực địa.
                </p>
              </div>

              {viewingStaffDetail && (
                <button
                  type="button"
                  onClick={() => setViewingStaffDetail(null)}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl self-start cursor-pointer"
                >
                  ✕ Đóng xem chi tiết nhân viên
                </button>
              )}
            </div>

            {/* Grid Thẻ Nhân viên Cơ sở */}
            {staffList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Chưa có nhân viên nào được phân bổ vào cơ sở này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {staffList.map((st) => {
                  const isSelected = viewingStaffDetail?.staffId === st.staffId;
                  const activeCount = st.activeTaskCount || 0;
                  const isOverloaded = activeCount >= 5;
                  const isNormal = activeCount >= 3 && activeCount < 5;

                  // Đếm task của nhân viên này trong toàn bộ hệ thống
                  const assignedTasksForStaff = allTasks.filter(
                    (t) => t.assignedStaffId === st.staffId
                  );

                  return (
                    <div
                      key={st.staffId}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between bg-white ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-200 shadow-md'
                          : 'border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Avatar & Trạng thái */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                              {st.staffName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                                {st.staffName}
                              </h4>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{st.staffPhone || 'Chưa cập nhật'}</span>
                              </p>
                            </div>
                          </div>

                          {isOverloaded ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              Quá tải
                            </span>
                          ) : isNormal ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                              Đang trực
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                              Sẵn sàng
                            </span>
                          )}
                        </div>

                        {/* Thống kê nhiệm vụ */}
                        <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-100 space-y-1 text-xs mb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Đang phụ trách:</span>
                            <span className="font-bold text-slate-900">{activeCount} việc</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-[11px]">Đã hoàn thành:</span>
                            <span className="font-semibold text-emerald-700">
                              {st.completedTaskCount || 0} việc
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Nút Xem chi tiết công việc của nhân viên này */}
                      <button
                        type="button"
                        onClick={() =>
                          setViewingStaffDetail(isSelected ? null : st)
                        }
                        className={`w-full py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>
                          {isSelected
                            ? 'Đang xem công việc'
                            : `Xem ${assignedTasksForStaff.length} việc được gán`}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drill-down: Danh sách việc của nhân viên đang chọn */}
          {viewingStaffDetail && (
            <div className="bg-white rounded-2xl border border-brand-200 shadow-sm p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                    {viewingStaffDetail.staffName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Nhiệm vụ đang giao cho: {viewingStaffDetail.staffName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      SĐT: {viewingStaffDetail.staffPhone} · Email: {viewingStaffDetail.staffEmail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingStaffDetail(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  ✕ Đóng
                </button>
              </div>

              {allTasks.filter((t) => t.assignedStaffId === viewingStaffDetail.staffId).length ===
              0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Nhân viên này hiện chưa được phân công nhiệm vụ nào.
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
