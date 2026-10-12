import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  AlertTriangle,
  KeyRound,
  ClipboardCheck,
  CheckCheck,
} from 'lucide-react';
import type { StaffDailyTaskReport, DailyIncidentTask, DailyCheckInTask, DailyReturnTask } from '@/types';
import { StaffWeekCalendarStrip } from './StaffWeekCalendarStrip';
import { StaffCheckInDetailView } from './StaffCheckInDetailView';
import { StaffReturnDetailView } from './StaffReturnDetailView';
import { StaffIncidentDetailView } from './StaffIncidentDetailView';

type ActiveTaskView =
  | { type: 'checkin'; task: DailyCheckInTask }
  | { type: 'return'; task: DailyReturnTask }
  | { type: 'incident'; task: DailyIncidentTask }
  | null;

interface DailyTasksOverviewProps {
  tasks: StaffDailyTaskReport;
  searchQuery?: string;
  selectedDate?: string;
  selectedFacilityId?: number;
  onRefresh: () => void;
  onDateChange?: (date: string) => void;
  onDetailViewChange?: (isOpen: boolean) => void;
  loading?: boolean;
}

export const DailyTasksOverview: React.FC<DailyTasksOverviewProps> = ({
  tasks,
  searchQuery = '',
  selectedDate = '',
  onRefresh,
  onDateChange,
  onDetailViewChange,
  loading = false,
}) => {
  const [filterCategory, setFilterCategory] = useState<'checkin' | 'return' | 'incident'>('checkin');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [activeTaskView, setActiveTaskView] = useState<ActiveTaskView>(null);

  useEffect(() => {
    onDetailViewChange?.(activeTaskView !== null);

    let subLabel: string | null = null;
    if (activeTaskView?.type === 'checkin') {
      subLabel = `Tiếp đón & Bàn giao (${activeTaskView.task.unitCode})`;
    } else if (activeTaskView?.type === 'return') {
      subLabel = `Nghiệm thu trả kho (${activeTaskView.task.unitCode})`;
    } else if (activeTaskView?.type === 'incident') {
      subLabel = `Xử lý sự cố (${activeTaskView.task.unitCode || activeTaskView.task.code || ''})`;
    }
    window.dispatchEvent(new CustomEvent('staff-sub-breadcrumb', { detail: subLabel }));

    return () => {
      onDetailViewChange?.(false);
      window.dispatchEvent(new CustomEvent('staff-sub-breadcrumb', { detail: null }));
    };
  }, [activeTaskView, onDetailViewChange]);

  useEffect(() => {
    const handleReset = () => setActiveTaskView(null);
    window.addEventListener('staff-reset-task-view', handleReset);
    return () => {
      window.removeEventListener('staff-reset-task-view', handleReset);
    };
  }, []);

  // Helper nhận diện công việc đã xong
  const isCheckInDone = (c: any) => Boolean(c.completed || c.status === 'COMPLETED' || c.status === 'ACTIVE');
  const isReturnDone = (r: any) => Boolean(r.completed || r.status === 'COMPLETED' || r.status === 'INSPECTED' || r.status === 'RETURNED');
  const isIncidentDone = (i: any) => Boolean(i.status === 'RESOLVED' || i.status === 'CLOSED');

  // Thống kê nhanh theo trạng thái ca trực
  const checkInDoneCount = tasks.pendingCheckIns.filter(isCheckInDone).length;
  const checkInPendingCount = tasks.pendingCheckIns.length - checkInDoneCount;

  const returnDoneCount = tasks.pendingReturns.filter(isReturnDone).length;
  const returnPendingCount = tasks.pendingReturns.length - returnDoneCount;

  const incidentDoneCount = tasks.openSupportRequests.filter(isIncidentDone).length;
  const incidentPendingCount = tasks.openSupportRequests.length - incidentDoneCount;

  const totalAllTasks = tasks.pendingCheckIns.length + tasks.pendingReturns.length + tasks.openSupportRequests.length;

  // Lọc tìm kiếm theo từ khóa searchQuery
  const q = searchQuery.trim().toLowerCase();
  const matchesSearch = (text?: string) => Boolean(text && text.toLowerCase().includes(q));

  // Lọc danh sách Check-in
  const filteredCheckIns = tasks.pendingCheckIns.filter((c) => {
    if (statusFilter === 'PENDING' && isCheckInDone(c)) return false;
    if (statusFilter === 'COMPLETED' && !isCheckInDone(c)) return false;
    if (q) {
      const matchName = matchesSearch(c.customerName);
      const matchPhone = matchesSearch(c.customerPhone);
      const matchUnit = matchesSearch(c.unitCode);
      const matchContract = matchesSearch(c.contractCode);
      if (!matchName && !matchPhone && !matchUnit && !matchContract) return false;
    }
    return true;
  });

  // Lọc danh sách Trả kho
  const filteredReturns = tasks.pendingReturns.filter((r) => {
    if (statusFilter === 'PENDING' && isReturnDone(r)) return false;
    if (statusFilter === 'COMPLETED' && !isReturnDone(r)) return false;
    if (q) {
      const matchName = matchesSearch(r.customerName);
      const matchPhone = matchesSearch(r.customerPhone);
      const matchUnit = matchesSearch(r.unitCode);
      const matchContract = matchesSearch(r.contractCode);
      if (!matchName && !matchPhone && !matchUnit && !matchContract) return false;
    }
    return true;
  });

  // Lọc danh sách Sự cố & Vận hành
  const filteredIncidents = tasks.openSupportRequests.filter((i) => {
    if (statusFilter === 'PENDING' && isIncidentDone(i)) return false;
    if (statusFilter === 'COMPLETED' && !isIncidentDone(i)) return false;
    if (q) {
      const matchTitle = matchesSearch(i.title);
      const matchCode = matchesSearch(i.code);
      const matchUnit = matchesSearch(i.unitCode);
      const matchCustomer = matchesSearch(i.customerName);
      const matchPhone = matchesSearch(i.customerPhone);
      if (!matchTitle && !matchCode && !matchUnit && !matchCustomer && !matchPhone) return false;
    }
    return true;
  });

  // Tính tổng số lượng tương ứng với nhóm đang chọn
  const currentPending =
    filterCategory === 'checkin'
      ? checkInPendingCount
      : filterCategory === 'return'
      ? returnPendingCount
      : incidentPendingCount;

  const currentDone =
    filterCategory === 'checkin'
      ? checkInDoneCount
      : filterCategory === 'return'
      ? returnDoneCount
      : incidentDoneCount;

  const totalFilteredCount =
    filterCategory === 'checkin'
      ? filteredCheckIns.length
      : filterCategory === 'return'
      ? filteredReturns.length
      : filteredIncidents.length;

  // Render từng thẻ Check-in gọn gàng (chỉ thông tin nhận diện cốt lõi, chi tiết nằm bên trong)
  const renderCheckInItem = (item: DailyCheckInTask) => {
    const isDone = isCheckInDone(item);
    const handleGoToCheckIn = () => {
      setActiveTaskView({ type: 'checkin', task: item });
    };

    return (
      <div
        key={item.reservationId || item.contractId}
        onClick={handleGoToCheckIn}
        className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
          isDone
            ? 'border-emerald-200/70 bg-emerald-50/15 hover:border-emerald-300'
            : 'border-slate-200/90 hover:border-teal-300 bg-white shadow-xs hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`px-3 h-10 min-w-[4.75rem] rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs whitespace-nowrap ${
              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}
          >
            {item.unitCode}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-sm truncate">{item.customerName}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {item.facilityName || 'Cơ sở phụ trách'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleGoToCheckIn();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            isDone
              ? 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
          }`}
        >
          <span>{isDone ? 'Xem hồ sơ' : 'Tiếp đón'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Render từng thẻ Trả kho gọn gàng
  const renderReturnItem = (item: DailyReturnTask) => {
    const isDone = isReturnDone(item);
    const handleGoToReturn = () => {
      setActiveTaskView({ type: 'return', task: item });
    };

    return (
      <div
        key={item.contractId}
        onClick={handleGoToReturn}
        className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
          isDone
            ? 'border-emerald-200/70 bg-emerald-50/15 hover:border-emerald-300'
            : 'border-slate-200/90 hover:border-blue-300 bg-white shadow-xs hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`px-3 h-10 min-w-[4.75rem] rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs whitespace-nowrap ${
              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {item.unitCode}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-sm truncate">{item.customerName}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {item.facilityName || 'Cơ sở phụ trách'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleGoToReturn();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            isDone
              ? 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
          }`}
        >
          <span>{isDone ? 'Xem biên bản' : 'Nghiệm thu'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  // Render từng thẻ Sự cố gọn gàng (tách tiêu đề ngắn gọn, chi tiết mô tả xem ở bên trong)
  const renderIncidentItem = (item: DailyIncidentTask) => {
    const isDone = isIncidentDone(item);
    const rawTitle = item.title || 'Sự cố vận hành';
    const colonIdx = rawTitle.indexOf(':');
    const shortTitle = colonIdx !== -1 ? rawTitle.slice(0, colonIdx).trim() : rawTitle;

    const handleGoToIncident = () => {
      setActiveTaskView({ type: 'incident', task: item });
    };

    return (
      <div
        key={item.ticketId || item.code}
        onClick={handleGoToIncident}
        className={`px-4 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
          isDone
            ? 'border-emerald-200/70 bg-emerald-50/15 hover:border-emerald-300'
            : 'border-slate-200/90 hover:border-amber-300 bg-white shadow-xs hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`px-3 h-10 min-w-[4.75rem] rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-xs whitespace-nowrap ${
              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {item.unitCode || '---'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900 text-sm truncate">{shortTitle}</p>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {item.customerName ? `Khách: ${item.customerName}` : 'Vận hành nội bộ'}
              {item.facilityName ? ` · ${item.facilityName}` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleGoToIncident();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
            isDone
              ? 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
          }`}
        >
          <span>{isDone ? 'Xem kết quả' : 'Xử lý ngay'}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${isDone ? 'text-slate-400' : ''}`} />
        </button>
      </div>
    );
  };

  if (activeTaskView) {
    if (activeTaskView.type === 'checkin') {
      return (
        <StaffCheckInDetailView
          task={activeTaskView.task}
          onBack={() => setActiveTaskView(null)}
          onSuccess={() => {
            setActiveTaskView(null);
            onRefresh();
          }}
        />
      );
    }
    if (activeTaskView.type === 'return') {
      return (
        <StaffReturnDetailView
          task={activeTaskView.task}
          onBack={() => setActiveTaskView(null)}
          onSuccess={() => {
            setActiveTaskView(null);
            onRefresh();
          }}
        />
      );
    }
    if (activeTaskView.type === 'incident') {
      return (
        <StaffIncidentDetailView
          task={activeTaskView.task}
          onBack={() => setActiveTaskView(null)}
          onSuccess={() => {
            setActiveTaskView(null);
            onRefresh();
          }}
        />
      );
    }
  }

  return (
    <div className="space-y-4">
      {/* Lịch ca trực tuần cuộn ngang - Chọn ngày hiển thị công việc tương ứng phía dưới */}
      {onDateChange && (
        <StaffWeekCalendarStrip
          selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
          onDateChange={onDateChange}
          totalTasksForSelectedDate={totalAllTasks}
        />
      )}
      {/* Bảng Danh sách Nhiệm vụ Ca trực Tập trung */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header điều khiển Danh mục & Trạng thái */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-3 sm:px-5 gap-3 bg-slate-50/40">
          {/* Lọc danh mục nhiệm vụ */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setFilterCategory('checkin')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterCategory === 'checkin'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-teal-50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Tiếp đón ({tasks.pendingCheckIns.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory('return')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterCategory === 'return'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Nghiệm thu ({tasks.pendingReturns.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterCategory('incident')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterCategory === 'incident'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sự cố ({tasks.openSupportRequests.length})</span>
            </button>
          </div>

          {/* Bộ lọc trạng thái: Chờ xử lý / Đã xong */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto bg-slate-100/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Chờ xử lý ({currentPending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'COMPLETED'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã xong ({currentDone})
            </button>
          </div>
        </div>

        {/* Nội dung danh sách công việc */}
        <div className="p-4 sm:p-5 space-y-2.5 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-b-2xl">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-slate-200 text-xs font-bold text-teal-700">
                <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang nạp dữ liệu công việc ca trực...</span>
              </div>
            </div>
          )}
          {totalFilteredCount === 0 ? (
            <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {q ? `Không tìm thấy kết quả nào khớp với "${searchQuery}"` : 'Không có công việc nào cần xử lý'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {q
                  ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm (SĐT, Họ tên, Mã kho) hoặc làm mới danh sách.'
                  : statusFilter === 'PENDING'
                  ? 'Tuyệt vời! Toàn bộ nhiệm vụ trong ca trực đã hoàn tất xuất sắc.'
                  : 'Hiện tại chưa có công việc nào hoàn tất trong mục này.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filterCategory === 'checkin' && filteredCheckIns.map(renderCheckInItem)}
              {filterCategory === 'return' && filteredReturns.map(renderReturnItem)}
              {filterCategory === 'incident' && filteredIncidents.map(renderIncidentItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

