import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Phone,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ClipboardCheck,
  ListFilter,
  CheckCheck,
} from 'lucide-react';
import type { StaffDailyTaskReport, DailyIncidentTask, DailyCheckInTask, DailyReturnTask } from '@/types';
import { StaffResolveIncidentModal } from './StaffResolveIncidentModal';
import { StaffWeekCalendarStrip } from './StaffWeekCalendarStrip';

interface DailyTasksOverviewProps {
  tasks: StaffDailyTaskReport;
  searchQuery?: string;
  selectedDate?: string;
  selectedFacilityId?: number;
  onRefresh: () => void;
  onDateChange?: (date: string) => void;
  loading?: boolean;
}

export const DailyTasksOverview: React.FC<DailyTasksOverviewProps> = ({
  tasks,
  searchQuery = '',
  selectedDate = '',
  selectedFacilityId = 0,
  onRefresh,
  onDateChange,
  loading = false,
}) => {
  const navigate = useNavigate();

  // Mặc định xem TẤT CẢ nhiệm vụ ca trực (không bắt ép bấm chuyển tab)
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'checkin' | 'return' | 'incident'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<DailyIncidentTask | null>(null);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  const handleOpenIncident = (ticket: DailyIncidentTask) => {
    setSelectedIncident(ticket);
    setIncidentModalOpen(true);
  };

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
  const totalAllPending = checkInPendingCount + returnPendingCount + incidentPendingCount;
  const totalAllDone = checkInDoneCount + returnDoneCount + incidentDoneCount;

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
  const currentTotal =
    filterCategory === 'checkin'
      ? tasks.pendingCheckIns.length
      : filterCategory === 'return'
      ? tasks.pendingReturns.length
      : filterCategory === 'incident'
      ? tasks.openSupportRequests.length
      : totalAllTasks;

  const currentPending =
    filterCategory === 'checkin'
      ? checkInPendingCount
      : filterCategory === 'return'
      ? returnPendingCount
      : filterCategory === 'incident'
      ? incidentPendingCount
      : totalAllPending;

  const currentDone =
    filterCategory === 'checkin'
      ? checkInDoneCount
      : filterCategory === 'return'
      ? returnDoneCount
      : filterCategory === 'incident'
      ? incidentDoneCount
      : totalAllDone;

  const totalFilteredCount =
    (filterCategory === 'ALL' || filterCategory === 'checkin' ? filteredCheckIns.length : 0) +
    (filterCategory === 'ALL' || filterCategory === 'return' ? filteredReturns.length : 0) +
    (filterCategory === 'ALL' || filterCategory === 'incident' ? filteredIncidents.length : 0);

  // Render từng thẻ Check-in
  const renderCheckInItem = (item: DailyCheckInTask) => {
    const isDone = isCheckInDone(item);
    const handleGoToCheckIn = () => {
      const params = new URLSearchParams();
      const cId = item.contractId || item.reservationId;
      if (cId) params.set('contractId', String(cId));
      if (selectedDate) params.set('date', selectedDate);
      if (selectedFacilityId) params.set('facilityId', String(selectedFacilityId));
      navigate(`/staff/check-in?${params.toString()}`);
    };

    return (
      <div
        key={item.reservationId || item.contractId}
        className={`p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDone
            ? 'border-emerald-200/70 bg-emerald-50/15 hover:border-emerald-300'
            : 'border-slate-200/90 hover:border-teal-300 bg-white shadow-xs hover:shadow-sm'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm ${
              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}
          >
            {item.unitCode}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base truncate">{item.customerName}</span>
              {item.customerPhone && (
                <a
                  href={`tel:${item.customerPhone}`}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition"
                  title="Gọi cho khách hàng"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{item.customerPhone}</span>
                </a>
              )}
              {item.contractCode && (
                <span className="font-mono text-xs text-slate-400">#{item.contractCode}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-teal-600" /> Giờ hẹn: <strong className="text-slate-800">{item.appointmentTime}</strong>
              </span>
              {item.facilityName && (
                <span className="text-slate-500 font-medium">· Cơ sở: {item.facilityName}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {isDone ? (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã bàn giao</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Chờ tiếp đón</span>
            </span>
          )}

          {isDone ? (
            <button
              type="button"
              onClick={handleGoToCheckIn}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>Hồ sơ bàn giao</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToCheckIn}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs hover:shadow-sm cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Tiếp đón & Bàn giao</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render từng thẻ Trả kho
  const renderReturnItem = (item: DailyReturnTask) => {
    const isDone = isReturnDone(item);
    const handleGoToReturn = () => {
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      if (selectedFacilityId) params.set('facilityId', String(selectedFacilityId));
      navigate(`/staff/return/${item.contractId}${params.toString() ? `?${params.toString()}` : ''}`);
    };

    return (
      <div
        key={item.contractId}
        className={`p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDone
            ? 'border-emerald-200/70 bg-emerald-50/15 hover:border-emerald-300'
            : 'border-slate-200/90 hover:border-blue-300 bg-white shadow-xs hover:shadow-sm'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm ${
              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {item.unitCode}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base truncate">{item.customerName}</span>
              {item.customerPhone && (
                <a
                  href={`tel:${item.customerPhone}`}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
                  title="Gọi cho khách hàng"
                >
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{item.customerPhone}</span>
                </a>
              )}
              {item.contractCode && (
                <span className="font-mono text-xs text-slate-400">#{item.contractCode}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-slate-600 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Hẹn trả: <strong className="text-slate-800">{item.appointmentTime}</strong>
              </span>
              {item.depositAmount !== undefined && (
                <span className="text-slate-600">
                  Tiền cọc: <strong className="font-mono text-emerald-700">{item.depositAmount.toLocaleString('vi-VN')} đ</strong>
                </span>
              )}
              {item.facilityName && (
                <span className="text-slate-500 font-medium">· Cơ sở: {item.facilityName}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {isDone ? (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã nghiệm thu</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Chờ kiểm tra phòng</span>
            </span>
          )}

          {isDone ? (
            <button
              type="button"
              onClick={handleGoToReturn}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <span>Biên bản nghiệm thu</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToReturn}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs hover:shadow-sm cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Tiến hành nghiệm thu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render từng thẻ Sự cố
  const renderIncidentItem = (item: DailyIncidentTask) => {
    const isDone = isIncidentDone(item);
    return (
      <div
        key={item.ticketId || item.code}
        className="p-4 rounded-xl border border-slate-200/90 hover:border-amber-300 bg-white shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {item.code && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {item.code}
                </span>
              )}
              <span className="font-bold text-slate-900 text-sm sm:text-base">{item.title || 'Sự cố vận hành'}</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                Ô {item.unitCode || '---'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {item.customerName && (
                <span>Khách: <strong className="text-slate-700">{item.customerName}</strong></span>
              )}
              {item.customerPhone && (
                <a href={`tel:${item.customerPhone}`} className="hover:text-teal-600 transition">
                  ({item.customerPhone})
                </a>
              )}
              {item.facilityName && <span>· Cơ sở: {item.facilityName}</span>}
              {item.createdAt && (
                <span className="text-slate-400">· Tạo: {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <span
            className={`font-semibold px-2.5 py-1 rounded-full text-xs ${
              isDone
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : item.status === 'IN_PROGRESS'
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}
          >
            {isDone
              ? 'Đã khắc phục'
              : item.status === 'IN_PROGRESS'
              ? 'Đang xử lý'
              : 'Cần xử lý'}
          </span>

          <button
            type="button"
            onClick={() => handleOpenIncident(item)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs hover:shadow-sm cursor-pointer"
          >
            {isDone ? (
              <span>Xem kết quả</span>
            ) : item.status === 'IN_PROGRESS' ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cập nhật & Nghiệm thu</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Xử lý ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

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
              onClick={() => setFilterCategory('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Tất cả nhiệm vụ</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                filterCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalAllTasks}
              </span>
            </button>

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

          {/* Bộ lọc trạng thái: Tất cả / Chờ xử lý / Đã xong */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto bg-slate-100/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả ({currentTotal})
            </button>
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
        <div className="p-4 sm:p-5 space-y-6 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-b-2xl">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-md border border-slate-200 text-xs font-bold text-teal-700">
                <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Đang nạp dữ liệu công việc ca trực...</span>
              </div>
            </div>
          )}
          {totalFilteredCount === 0 ? (
            <div className="py-14 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
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
                  : 'Hiện tại chưa có công việc nào được phân công trong ngày này.'}
              </p>
            </div>
          ) : (
            <>
              {/* KHỐI 1: LỊCH TIẾP ĐÓN NHẬN KHO (CHECK-IN) */}
              {(filterCategory === 'ALL' || filterCategory === 'checkin') && filteredCheckIns.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-teal-600" />
                      <span>1. Lịch tiếp đón nhận kho ({filteredCheckIns.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (selectedDate) params.set('date', selectedDate);
                        if (selectedFacilityId) params.set('facilityId', String(selectedFacilityId));
                        navigate(`/staff/check-in${params.toString() ? `?${params.toString()}` : ''}`);
                      }}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở bàn Check-in toàn cảnh</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filteredCheckIns.map(renderCheckInItem)}
                  </div>
                </div>
              )}

              {/* KHỐI 2: LỊCH TRẢ KHO & NGHIỆM THU PHÒNG (RETURN) */}
              {(filterCategory === 'ALL' || filterCategory === 'return') && filteredReturns.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-blue-600" />
                      <span>2. Lịch trả kho & Nghiệm thu phòng ({filteredReturns.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (selectedDate) params.set('date', selectedDate);
                        if (selectedFacilityId) params.set('facilityId', String(selectedFacilityId));
                        navigate(`/staff/return${params.toString() ? `?${params.toString()}` : ''}`);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tra cứu tất cả hợp đồng trả kho</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filteredReturns.map(renderReturnItem)}
                  </div>
                </div>
              )}

              {/* KHỐI 3: SỰ CỐ KỸ THUẬT & VẬN HÀNH (INCIDENTS) */}
              {(filterCategory === 'ALL' || filterCategory === 'incident') && filteredIncidents.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>3. Sự cố kỹ thuật & Vận hành thực địa ({filteredIncidents.length})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => navigate('/staff/incidents')}
                      className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Chi tiết sự cố</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {filteredIncidents.map(renderIncidentItem)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal xử lý sự cố tại hiện trường */}
      <StaffResolveIncidentModal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        ticket={selectedIncident}
        onSuccess={() => {
          onRefresh();
          setIncidentModalOpen(false);
        }}
      />
    </div>
  );
};
