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
} from 'lucide-react';
import type { StaffDailyTaskReport } from '@/types';

interface DailyTasksOverviewProps {
  tasks: StaffDailyTaskReport;
  onRefresh: () => void;
}

export const DailyTasksOverview: React.FC<DailyTasksOverviewProps> = ({ tasks, onRefresh }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checkin' | 'return' | 'incident'>('checkin');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING'>('ALL');

  // Lọc theo tab & trạng thái
  const filteredCheckIns = tasks.pendingCheckIns.filter((c) =>
    statusFilter === 'ALL' ? true : c.status !== 'COMPLETED'
  );
  const filteredReturns = tasks.pendingReturns.filter((r) =>
    statusFilter === 'ALL' ? true : r.status === 'PENDING_INSPECTION'
  );
  const filteredIncidents = tasks.openSupportRequests.filter((i) =>
    statusFilter === 'ALL' ? true : i.status !== 'RESOLVED'
  );

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
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
              Hôm nay
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Lịch hẹn Trả kho</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {tasks.pendingReturns.length}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              Chờ nghiệm thu
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Sự cố khẩn SLA</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600 font-mono">
              {tasks.openSupportRequests.filter((i) => i.priority === 'URGENT').length}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700">
              SLA 2h
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('checkin')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'checkin'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1. Lịch nhận kho</span>
              <span className="px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 text-xs font-mono">
                {tasks.pendingCheckIns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('return')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'return'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2. Lịch trả kho</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-xs font-mono">
                {tasks.pendingReturns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('incident')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'incident'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>3. Sự cố & Vận hành</span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 text-xs font-mono">
                {tasks.openSupportRequests.length}
              </span>
            </button>
          </div>

          {/* Lọc & Nút Refresh */}
          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING')}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">Tất cả việc</option>
                <option value="PENDING">Chỉ việc chưa xong</option>
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
                  Không có lịch hẹn nhận kho nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredCheckIns.map((item) => (
                  <div
                    key={item.reservationId}
                    className="p-4 rounded-xl border border-slate-200 hover:border-teal-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{item.customerName}</span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700">
                          {item.unitCode}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            item.status === 'ARRIVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status === 'ARRIVED' ? 'Khách đã đến' : 'Chưa đến'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Giờ hẹn: {item.appointmentTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {item.customerPhone}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/staff/checkin')}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <span>Tiếp đón & Bàn giao</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: RETURN QUEUE */}
          {activeTab === 'return' && (
            <div className="space-y-3">
              {filteredReturns.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không có lịch hẹn trả kho nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredReturns.map((item) => (
                  <div
                    key={item.contractId}
                    className="p-4 rounded-xl border border-slate-200 hover:border-amber-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{item.customerName}</span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                          {item.unitCode}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{item.contractCode}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Hẹn trả: {item.appointmentTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {item.customerPhone}
                        </span>
                        <span>
                          Cọc: <b className="font-mono text-slate-800">{item.depositAmount.toLocaleString('vi-VN')} đ</b>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/staff/return/${item.contractId}`)}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <span>Tiến hành nghiệm thu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: INCIDENTS & OVERLOCK */}
          {activeTab === 'incident' && (
            <div className="space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không có sự cố hoặc nhiệm vụ vận hành nào tồn đọng.
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
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {item.customerName && (
                          <span>
                            Khách: <strong className="text-slate-700">{item.customerName}</strong>
                          </span>
                        )}
                        <span className="text-rose-600 font-medium">Hạn SLA: {item.slaDeadline || 'SLA 2h'}</span>
                        <span
                          className={`font-medium px-2 py-0.2 rounded text-[11px] ${
                            item.status === 'IN_PROGRESS'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {item.status === 'IN_PROGRESS' ? 'Đang xử lý' : 'Chưa tiếp nhận'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`Nhiệm vụ #${item.code || item.ticketId} đã được ghi nhận vào nhật ký ca trực.`)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium shrink-0"
                    >
                      {item.status === 'IN_PROGRESS' ? 'Cập nhật tiến độ' : 'Tiếp nhận xử lý'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
