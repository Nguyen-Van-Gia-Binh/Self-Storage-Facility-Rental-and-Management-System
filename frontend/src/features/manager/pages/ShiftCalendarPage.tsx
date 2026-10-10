// frontend/src/features/manager/pages/ShiftCalendarPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { getStaffWorkload, getDailyDispatchTasks, assignStaffToTask } from '../api/staffAssignmentApi';
import type { FacilityListItem } from '@/types';
import type { StaffWorkloadItem, DailyDispatchTaskItem, AssignTaskPayload } from '../types/staffAssignment';
import { Breadcrumb } from '../components/Breadcrumb';
import { WorkItemCard } from '../components/WorkItemCard';
import { AssignStaffModal } from '../components/AssignStaffModal';

export type TaskTabFilter = 'ALL' | 'UNASSIGNED' | 'CHECK_IN' | 'RETURN' | 'INCIDENT';

export const ShiftCalendarPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();

  const [facility, setFacility] = useState<FacilityListItem | null>(null);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [tasks, setTasks] = useState<DailyDispatchTaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [tabFilter, setTabFilter] = useState<TaskTabFilter>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
        getDailyDispatchTasks(Number(facilityId)).catch(() => []),
      ]);

      const currentFac = facRes.find((f) => String(f.id) === String(facilityId));
      if (currentFac) {
        setFacility(currentFac);
      }

      setStaffList(staffData || []);
      setTasks(taskData || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tải thông tin cơ sở và nhiệm vụ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [facilityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thống kê nhanh công việc
  const stats = useMemo(() => {
    const total = tasks.length;
    const unassigned = tasks.filter((t) => t.status === 'UNASSIGNED' || !t.assignedStaffId).length;
    const inProgress = tasks.filter(
      (t) => (t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS') && t.assignedStaffId
    ).length;
    const completed = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'RESOLVED').length;

    const checkIns = tasks.filter((t) => t.taskType === 'CHECK_IN').length;
    const returns = tasks.filter((t) => t.taskType === 'RETURN').length;
    const incidents = tasks.filter((t) => t.taskType === 'INCIDENT').length;

    return { total, unassigned, inProgress, completed, checkIns, returns, incidents };
  }, [tasks]);

  // Lọc nhiệm vụ
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Lọc theo Tab
      if (tabFilter === 'UNASSIGNED' && (t.status !== 'UNASSIGNED' && Boolean(t.assignedStaffId))) {
        return false;
      }
      if (tabFilter === 'CHECK_IN' && t.taskType !== 'CHECK_IN') return false;
      if (tabFilter === 'RETURN' && t.taskType !== 'RETURN') return false;
      if (tabFilter === 'INCIDENT' && t.taskType !== 'INCIDENT') return false;

      // 2. Lọc theo Nhân viên
      if (selectedStaffFilter !== 'ALL' && t.assignedStaffId !== selectedStaffFilter) {
        return false;
      }

      // 3. Tìm kiếm từ khóa
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
  }, [tasks, tabFilter, selectedStaffFilter, searchQuery]);

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
      // Tải lại dữ liệu nhẹ nhàng
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

      {/* Header Cơ sở & Thao tác */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  · Bảng Điều phối & Phân công Công việc
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Đang cập nhật...' : 'Làm mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Thẻ KPI Chỉ số Công việc */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Tổng nhiệm vụ</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Check-in, trả kho, sự cố</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setTabFilter('UNASSIGNED')}
          className={`bg-white rounded-2xl border shadow-2xs p-4 flex items-center justify-between cursor-pointer transition-all ${
            tabFilter === 'UNASSIGNED'
              ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/40'
              : 'border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-amber-700">Chờ phân công</p>
              {stats.unassigned > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.unassigned}</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Cần gán nhân viên phụ trách</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-700">Đang thực hiện</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
            <p className="text-[11px] text-blue-500 mt-0.5">Đã phân công cho nhân viên</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700">Đã hoàn thành</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Nghiệm thu & bàn giao xong</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* KHỐI 1: ĐỘI NGŨ NHÂN VIÊN CƠ SỞ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Đội ngũ nhân sự trực thuộc cơ sở</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {staffList.length} nhân viên
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi khối lượng công việc và phân bổ nhiệm vụ trực tiếp cho từng nhân viên.
            </p>
          </div>

          {selectedStaffFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedStaffFilter('ALL')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1 rounded-xl self-start cursor-pointer"
            >
              ✕ Bỏ lọc theo nhân viên
            </button>
          )}
        </div>

        {staffList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Chưa có nhân viên nào được gán vào cơ sở này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {staffList.map((st) => {
              const isSelected = selectedStaffFilter === st.staffId;
              const activeCount = st.activeTaskCount || 0;
              const isOverloaded = activeCount >= 5;
              const isNormal = activeCount >= 3 && activeCount < 5;

              return (
                <div
                  key={st.staffId}
                  onClick={() =>
                    setSelectedStaffFilter(isSelected ? 'ALL' : st.staffId)
                  }
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-200 shadow-sm'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {st.staffName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">
                            {st.staffName}
                          </h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                            <Phone className="w-2.5 h-2.5 shrink-0" />
                            <span>{st.staffPhone || 'Chưa cập nhật'}</span>
                          </p>
                        </div>
                      </div>

                      {isOverloaded ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                          Quá tải
                        </span>
                      ) : isNormal ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          Đang trực
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Sẵn sàng
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500 text-[11px]">Đang phụ trách:</span>
                      <span className="font-bold text-slate-900">
                        {activeCount} nhiệm vụ
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-center font-semibold text-brand-600 bg-slate-50 py-1 rounded-lg">
                    {isSelected ? '✓ Đang lọc việc của người này' : 'Bấm để lọc việc'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KHỐI 2: BẢNG ĐIỀU PHỐI CÔNG VIỆC THỰC ĐỊA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        {/* Header khối */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Hàng đợi công việc thực địa cần xử lý</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200/80">
                {filteredTasks.length} việc
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách tiếp đón khách nhận kho (Check-in), kiểm tra trả kho (Return) và xử lý sự cố kỹ thuật.
            </p>
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo kho, khách, mã đơn..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setTabFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              tabFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('UNASSIGNED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              tabFilter === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <span>Chờ phân công</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                tabFilter === 'UNASSIGNED' ? 'bg-amber-700 text-white' : 'bg-amber-200/80 text-amber-900'
              }`}
            >
              {stats.unassigned}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('CHECK_IN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              tabFilter === 'CHECK_IN'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            Check-in nhận kho ({stats.checkIns})
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('RETURN')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              tabFilter === 'RETURN'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            Nghiệm thu trả kho ({stats.returns})
          </button>

          <button
            type="button"
            onClick={() => setTabFilter('INCIDENT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              tabFilter === 'INCIDENT'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            }`}
          >
            Sự cố kỹ thuật ({stats.incidents})
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw className="w-8 h-8 text-brand-600 animate-spin mb-3" />
            <p className="text-xs font-semibold">Đang tải danh sách nhiệm vụ...</p>
          </div>
        )}

        {/* Error state */}
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

        {/* Danh sách nhiệm vụ */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Không có nhiệm vụ nào</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Hiện không có công việc nào phù hợp với bộ lọc đã chọn.
                </p>
              </div>
            ) : (
              filteredTasks.map((t) => (
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

      {/* Modal Phân công nhân viên */}
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
