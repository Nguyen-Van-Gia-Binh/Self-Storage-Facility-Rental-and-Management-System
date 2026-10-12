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
} from 'lucide-react';
import type { StaffDailyTaskReport, DailyIncidentTask } from '@/types';
import { StaffResolveIncidentModal } from './StaffResolveIncidentModal';

interface DailyTasksOverviewProps {
  tasks: StaffDailyTaskReport;
  searchQuery?: string;
  selectedDate?: string;
  selectedFacilityId?: number;
  onRefresh: () => void;
}

export const DailyTasksOverview: React.FC<DailyTasksOverviewProps> = ({
  tasks,
  searchQuery = '',
  selectedDate = '',
  selectedFacilityId = 0,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checkin' | 'return' | 'incident'>('checkin');
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

  // Số lượng hiển thị theo tab hiện tại
  const currentTotal =
    activeTab === 'checkin'
      ? tasks.pendingCheckIns.length
      : activeTab === 'return'
      ? tasks.pendingReturns.length
      : tasks.openSupportRequests.length;

  const currentPending =
    activeTab === 'checkin'
      ? checkInPendingCount
      : activeTab === 'return'
      ? returnPendingCount
      : incidentPendingCount;

  const currentDone =
    activeTab === 'checkin'
      ? checkInDoneCount
      : activeTab === 'return'
      ? returnDoneCount
      : incidentDoneCount;

  return (
    <div className="space-y-4">
      {/* 3 Cards Thống kê KPI ca trực - Dàn đều 3 cột cân đối & Bỏ Overlock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Thẻ 1: Lịch Check-in */}
        <button
          type="button"
          onClick={() => setActiveTab('checkin')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 shadow-xs relative overflow-hidden group ${
            activeTab === 'checkin'
              ? 'bg-teal-50/40 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200/90 hover:border-teal-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
              <KeyRound className="w-4.5 h-4.5 text-teal-600" />
              Lịch Check-in hôm nay
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              checkInPendingCount > 0 ? 'bg-teal-100 text-teal-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {checkInPendingCount} chờ tiếp đón
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {tasks.pendingCheckIns.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {checkInDoneCount} đã hoàn tất bàn giao
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{
                width: tasks.pendingCheckIns.length > 0
                  ? `${(checkInDoneCount / tasks.pendingCheckIns.length) * 100}%`
                  : '100%',
              }}
            />
          </div>
        </button>

        {/* Thẻ 2: Lịch hẹn Trả kho */}
        <button
          type="button"
          onClick={() => setActiveTab('return')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 shadow-xs relative overflow-hidden group ${
            activeTab === 'return'
              ? 'bg-blue-50/40 border-blue-500 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
              <ClipboardCheck className="w-4.5 h-4.5 text-blue-600" />
              Lịch Trả kho & Nghiệm thu
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              returnPendingCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {returnPendingCount} chờ nghiệm thu
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {tasks.pendingReturns.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {returnDoneCount} đã hoàn tất nghiệm thu
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{
                width: tasks.pendingReturns.length > 0
                  ? `${(returnDoneCount / tasks.pendingReturns.length) * 100}%`
                  : '100%',
              }}
            />
          </div>
        </button>

        {/* Thẻ 3: Sự cố thực địa */}
        <button
          type="button"
          onClick={() => setActiveTab('incident')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 shadow-xs relative overflow-hidden group ${
            activeTab === 'incident'
              ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/20'
              : tasks.openSupportRequests.length > 0
              ? 'bg-amber-50/20 border-amber-200 hover:border-amber-400'
              : 'bg-white border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              Sự cố kỹ thuật & Vận hành
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              incidentPendingCount > 0 ? 'bg-amber-100 text-amber-900 font-bold' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {incidentPendingCount > 0 ? `${incidentPendingCount} cần xử lý` : 'Đã thông suốt'}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              incidentPendingCount > 0 ? 'text-amber-700' : 'text-slate-900'
            }`}>
              {tasks.openSupportRequests.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {incidentDoneCount} đã khắc phục xong
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{
                width: tasks.openSupportRequests.length > 0
                  ? `${(incidentDoneCount / tasks.openSupportRequests.length) * 100}%`
                  : '100%',
              }}
            />
          </div>
        </button>
      </div>

      {/* Tabs bar & Danh mục công việc 100% Full Width */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 p-3 sm:px-5 gap-3 bg-slate-50/40">
          {/* 3 Tabs chính */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('checkin')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'checkin'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>1. Lịch nhận kho</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'checkin'
                  ? 'bg-white/20 text-white'
                  : checkInPendingCount > 0
                  ? 'bg-teal-100 text-teal-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {checkInPendingCount > 0 ? `${checkInPendingCount} chờ` : `${tasks.pendingCheckIns.length} xong`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('return')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'return'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>2. Lịch trả kho</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'return'
                  ? 'bg-white/20 text-white'
                  : returnPendingCount > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {returnPendingCount > 0 ? `${returnPendingCount} chờ` : `${tasks.pendingReturns.length} xong`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('incident')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'incident'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>3. Sự cố & Vận hành</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                activeTab === 'incident'
                  ? 'bg-white/20 text-white'
                  : incidentPendingCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {incidentPendingCount > 0 ? `${incidentPendingCount} cần xử lý` : `${tasks.openSupportRequests.length} xong`}
              </span>
            </button>
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs font-semibold self-start sm:self-center">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tất cả ({currentTotal})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-amber-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Chờ xử lý ({currentPending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'COMPLETED'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Đã xong ({currentDone})
            </button>
          </div>
        </div>

        {/* Nội dung tương ứng từng Tab */}
        <div className="p-4 sm:p-5">
          {/* TAB 1: CHECK-IN QUEUE */}
          {activeTab === 'checkin' && (
            <div className="space-y-3">
              {filteredCheckIns.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                  <div className="w-12 h-12 mx-auto rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {q ? `Không tìm thấy kết quả nào khớp với "${searchQuery}"` : 'Không có lịch hẹn nhận kho cần xử lý'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    {q
                      ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm (SĐT, Họ tên, Mã kho) hoặc làm mới danh sách.'
                      : statusFilter === 'PENDING'
                      ? 'Tuyệt vời! Toàn bộ lịch nhận kho trong ca trực đã được tiếp đón & bàn giao hoàn tất.'
                      : 'Chưa có lịch hẹn nhận kho nào được xếp trong ngày này.'}
                  </p>
                  {!q && (
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (selectedDate) params.set('date', selectedDate);
                        if (selectedFacilityId) params.set('facilityId', String(selectedFacilityId));
                        navigate(`/staff/check-in${params.toString() ? `?${params.toString()}` : ''}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Tiếp đón khách vãng lai (Check-in ngay)</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredCheckIns.map((item) => {
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
                        {/* Unit Code Badge to bản */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm ${
                          isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
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

                      {/* Trạng thái & Nút thao tác 1 chạm */}
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
                })
              )}
            </div>
          )}

          {/* TAB 2: RETURN QUEUE */}
          {activeTab === 'return' && (
            <div className="space-y-3">
              {filteredReturns.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                  <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {q ? `Không tìm thấy kết quả nào khớp với "${searchQuery}"` : 'Không có lịch hẹn trả kho cần xử lý'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                    {q
                      ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc làm mới danh sách.'
                      : statusFilter === 'PENDING'
                      ? 'Toàn bộ hợp đồng trả kho đã được nghiệm thu và hoàn cọc hoàn tất.'
                      : 'Chưa có hợp đồng nào hẹn trả kho trong ngày này.'}
                  </p>
                  {!q && (
                    <button
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (selectedDate) params.set('date', selectedDate);
                        if (selectedFacilityId) params.set('facilityId', String(selectedFacilityId));
                        navigate(`/staff/return${params.toString() ? `?${params.toString()}` : ''}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Tra cứu hợp đồng trả kho</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredReturns.map((item) => {
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
                        {/* Unit Code Badge */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-mono font-bold text-sm ${
                          isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
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
                              <span className="text-slate-500">· {item.facilityName}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Trạng thái & Nút thao tác 1 chạm */}
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
                })
              )}
            </div>
          )}

          {/* TAB 3: INCIDENTS */}
          {activeTab === 'incident' && (
            <div className="space-y-3">
              {/* Shortcut chuyển nhanh sang trang Sự cố chi tiết */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs gap-2">
                <span className="text-amber-950 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Xem và xử lý toàn bộ sự cố kỹ thuật và kiểm tra thực địa ca trực:
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/staff/incidents')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1 shrink-0 transition shadow-xs self-start sm:self-auto cursor-pointer"
                >
                  <span>Mở Trang Sự cố chi tiết</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">
                    {q ? `Không tìm thấy kết quả nào khớp với "${searchQuery}"` : 'Không có sự cố kỹ thuật nào tồn đọng'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {q
                      ? 'Vui lòng kiểm tra lại từ khóa tìm kiếm.'
                      : 'Hệ thống vận hành và các ô kho tại cơ sở đang hoạt động an toàn và ổn định.'}
                  </p>
                </div>
              ) : (
                filteredIncidents.map((item) => (
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
                          {item.facilityName && <span>· {item.facilityName}</span>}
                          {item.createdAt && (
                            <span className="text-slate-400">· Tạo: {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <span
                        className={`font-semibold px-2.5 py-1 rounded-full text-xs ${
                          item.status === 'RESOLVED' || item.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'IN_PROGRESS'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status === 'RESOLVED' || item.status === 'CLOSED'
                          ? 'Đã khắc phục'
                          : item.status === 'IN_PROGRESS'
                          ? 'Đang xử lý'
                          : 'Cần xử lý'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenIncident(item)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs hover:shadow-sm"
                      >
                        {item.status === 'RESOLVED' || item.status === 'CLOSED' ? (
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
                ))
              )}
            </div>
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
