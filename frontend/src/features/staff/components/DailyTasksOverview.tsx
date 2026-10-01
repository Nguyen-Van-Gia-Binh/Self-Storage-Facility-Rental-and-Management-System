import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Phone,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Lock,
  Filter,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { StaffDailyTaskReport, DailyIncidentTask } from '@/types';
import { StaffResolveIncidentModal } from './StaffResolveIncidentModal';

interface DailyTasksOverviewProps {
  tasks: StaffDailyTaskReport;
  onRefresh: () => void;
}

export const DailyTasksOverview: React.FC<DailyTasksOverviewProps> = ({ tasks, onRefresh }) => {
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

  // Thống kê nhanh theo trạng thái
  const checkInDoneCount = tasks.pendingCheckIns.filter(isCheckInDone).length;
  const checkInPendingCount = tasks.pendingCheckIns.length - checkInDoneCount;

  const returnDoneCount = tasks.pendingReturns.filter(isReturnDone).length;
  const returnPendingCount = tasks.pendingReturns.length - returnDoneCount;

  const incidentDoneCount = tasks.openSupportRequests.filter(isIncidentDone).length;
  const incidentPendingCount = tasks.openSupportRequests.length - incidentDoneCount;

  // Lọc theo tab & trạng thái
  const filteredCheckIns = tasks.pendingCheckIns.filter((c) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return !isCheckInDone(c);
    if (statusFilter === 'COMPLETED') return isCheckInDone(c);
    return true;
  });

  const filteredReturns = tasks.pendingReturns.filter((r) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return !isReturnDone(r);
    if (statusFilter === 'COMPLETED') return isReturnDone(r);
    return true;
  });

  const filteredIncidents = tasks.openSupportRequests.filter((i) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return !isIncidentDone(i);
    if (statusFilter === 'COMPLETED') return isIncidentDone(i);
    return true;
  });

  // Số lượng hiển thị theo tab hiện tại
  const currentTotal = activeTab === 'checkin' ? tasks.pendingCheckIns.length : activeTab === 'return' ? tasks.pendingReturns.length : tasks.openSupportRequests.length;
  const currentPending = activeTab === 'checkin' ? checkInPendingCount : activeTab === 'return' ? returnPendingCount : incidentPendingCount;
  const currentDone = activeTab === 'checkin' ? checkInDoneCount : activeTab === 'return' ? returnDoneCount : incidentDoneCount;

  return (
    <div className="space-y-5">
      {/* 4 Cards Thống kê KPI ca trực */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Lịch Check-in</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {tasks.pendingCheckIns.length}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${checkInPendingCount > 0 ? 'bg-teal-50 text-teal-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {checkInPendingCount} chờ • {checkInDoneCount} xong
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Lịch hẹn Trả kho</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {tasks.pendingReturns.length}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${returnPendingCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {returnPendingCount} chờ • {returnDoneCount} xong
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Sự cố kỹ thuật</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 font-mono">
              {tasks.openSupportRequests.length}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              Cần xử lý
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Nhiệm vụ Overlock</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {tasks.openSupportRequests.filter((i) => i.isOverlockTask).length}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700">
              Mốc D+4
            </span>
          </div>
        </div>
      </div>

      {/* Tabs bar & Thanh công cụ lọc */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 p-2 sm:px-4 gap-2 bg-slate-50/50">
          {/* 3 Tabs chính theo US-FS-06.1 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'checkin'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1. Lịch nhận kho</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                checkInPendingCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {checkInPendingCount > 0 ? `${checkInPendingCount} chờ` : `${tasks.pendingCheckIns.length} xong`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('return')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'return'
                  ? 'bg-white text-amber-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2. Lịch trả kho</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                returnPendingCount > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {returnPendingCount > 0 ? `${returnPendingCount} chờ` : `${tasks.pendingReturns.length} xong`}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('incident')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 shrink-0 ${
                activeTab === 'incident'
                  ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>3. Sự cố & Vận hành</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                incidentPendingCount > 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {incidentPendingCount > 0 ? `${incidentPendingCount} cần xử lý` : `${tasks.openSupportRequests.length} xong`}
              </span>
            </button>
          </div>

          {/* Thanh công cụ lọc trực quan & Nút Refresh */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Quick Status Chips */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả ({currentTotal})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded-md transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-amber-800 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chờ xử lý ({currentPending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-md transition ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Đã xong ({currentDone})
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'COMPLETED')}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả việc ({currentTotal})</option>
                <option value="PENDING">Chờ xử lý ({currentPending})</option>
                <option value="COMPLETED">Đã hoàn tất ({currentDone})</option>
              </select>
            </div>

            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1"
              title="Làm mới danh sách"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Nội dung tương ứng từng Tab */}
        <div className="p-4">
          {/* TAB 1: CHECK-IN QUEUE */}
          {activeTab === 'checkin' && (
            <div className="space-y-3">
              {filteredCheckIns.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {statusFilter === 'PENDING'
                    ? 'Tuyệt vời! Toàn bộ lịch nhận kho trong ca trực đã được tiếp đón & bàn giao hoàn tất.'
                    : statusFilter === 'COMPLETED'
                    ? 'Chưa có hợp đồng nào hoàn tất bàn giao trong bộ lọc này.'
                    : 'Không có lịch hẹn nhận kho nào trong ngày.'}
                </div>
              ) : (
                filteredCheckIns.map((item) => {
                  const isDone = isCheckInDone(item);
                  return (
                    <div
                      key={item.reservationId || item.contractId}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDone
                          ? 'border-emerald-200/80 bg-emerald-50/20 hover:border-emerald-300'
                          : 'border-slate-200 hover:border-teal-200 bg-white'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{item.customerName}</span>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                            {item.unitCode}
                          </span>
                          {item.facilityName && (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {item.facilityName}
                            </span>
                          )}
                          {item.contractCode && (
                            <span className="font-mono text-xs text-slate-400">
                              {item.contractCode}
                            </span>
                          )}
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã bàn giao (Hoàn tất)</span>
                            </span>
                          ) : item.status === 'ARRIVED' ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Khách đã đến quầy</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              <span>Chờ đón khách</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Giờ hẹn: {item.appointmentTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {item.customerPhone}
                          </span>
                        </div>
                      </div>

                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => navigate('/staff/check-in')}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Xem hồ sơ bàn giao</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate('/staff/check-in')}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition"
                        >
                          <span>Tiếp đón & Bàn giao</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
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
                <div className="p-8 text-center text-slate-400 text-sm">
                  {statusFilter === 'PENDING'
                    ? 'Toàn bộ hợp đồng trả kho đã được nghiệm thu hoàn tất.'
                    : statusFilter === 'COMPLETED'
                    ? 'Chưa có hợp đồng nào hoàn tất trả kho trong bộ lọc này.'
                    : 'Không có lịch hẹn trả kho nào trong ngày.'}
                </div>
              ) : (
                filteredReturns.map((item) => {
                  const isDone = isReturnDone(item);
                  return (
                    <div
                      key={item.contractId}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isDone
                          ? 'border-emerald-200/80 bg-emerald-50/20 hover:border-emerald-300'
                          : 'border-slate-200 hover:border-amber-200 bg-white'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{item.customerName}</span>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                            {item.unitCode}
                          </span>
                          {item.facilityName && (
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {item.facilityName}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono">{item.contractCode}</span>
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã nghiệm thu (Hoàn tất)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Chờ nghiệm thu</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Hẹn trả: {item.appointmentTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> {item.customerPhone}
                          </span>
                          {item.depositAmount !== undefined && (
                            <span>
                              Cọc: <b className="font-mono text-slate-800">{item.depositAmount.toLocaleString('vi-VN')} đ</b>
                            </span>
                          )}
                        </div>
                      </div>

                      {isDone ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/staff/return/${item.contractId}`)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-xs transition"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Xem biên bản nghiệm thu</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/staff/return/${item.contractId}`)}
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition"
                        >
                          <span>Tiến hành nghiệm thu</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: INCIDENTS & OVERLOCK */}
          {activeTab === 'incident' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs">
                <span className="text-teal-900 font-medium">
                  Xem và xử lý toàn bộ sự cố kỹ thuật, cắt khóa cơ và kiểm tra thực địa ca trực:
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/staff/incidents')}
                  className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1 shrink-0 transition"
                >
                  <span>Trang Xử lý sự cố chi tiết</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  {statusFilter === 'PENDING'
                    ? 'Không có sự cố hoặc nhiệm vụ vận hành nào tồn đọng.'
                    : statusFilter === 'COMPLETED'
                    ? 'Chưa có sự cố nào hoàn tất trong bộ lọc này.'
                    : 'Không có sự cố hoặc nhiệm vụ vận hành nào trong ca trực.'}
                </div>
              ) : (
                filteredIncidents.map((item) => (
                  <div
                    key={item.ticketId || item.code}
                    className="p-4 rounded-xl border border-slate-200 hover:border-rose-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.isOverlockTask ? (
                          <span className="p-1 rounded bg-purple-100 text-purple-700" title="Khóa ngoài Overlock">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-rose-100 text-rose-700" title="Sự cố kỹ thuật / Hỗ trợ">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {item.code && (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {item.code}
                          </span>
                        )}
                        <span className="font-bold text-slate-900 text-sm">{item.title || 'Sự cố vận hành'}</span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.unitCode || '---'}
                        </span>
                        {item.facilityName && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {item.facilityName}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {item.customerName && (
                          <span>
                            Khách: <strong className="text-slate-700">{item.customerName}</strong>
                            {item.customerPhone && <span className="ml-1 text-slate-400">({item.customerPhone})</span>}
                          </span>
                        )}
                        {item.createdAt && (
                          <span className="text-slate-500 font-medium">Tạo lúc: {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        <span
                          className={`font-medium px-2 py-0.2 rounded text-[11px] ${
                            item.status === 'RESOLVED' || item.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'RESOLVED' || item.status === 'CLOSED'
                            ? 'Đã khắc phục'
                            : item.status === 'IN_PROGRESS'
                            ? 'Đang xử lý'
                            : 'Mới được giao'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenIncident(item)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                        item.status === 'IN_PROGRESS'
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                          : item.status === 'RESOLVED' || item.status === 'CLOSED'
                          ? 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          : 'bg-sky-600 hover:bg-sky-700 text-white shadow-xs'
                      }`}
                    >
                      {item.status === 'IN_PROGRESS' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Cập nhật tiến độ & Nghiệm thu</span>
                        </>
                      ) : item.status === 'RESOLVED' || item.status === 'CLOSED' ? (
                        <span>Xem biên bản kết quả</span>
                      ) : (
                        <span>Xử lý sự cố</span>
                      )}
                    </button>
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
