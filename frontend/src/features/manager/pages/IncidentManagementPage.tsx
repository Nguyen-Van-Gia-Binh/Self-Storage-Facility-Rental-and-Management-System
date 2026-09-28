import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  UserPlus,
  ArrowRightLeft,
  Filter,
} from 'lucide-react';
import type {
  ManagementSupportTicket,
  SupportStatus,
  SupportCategory,
  StaffWorkloadItem,
  DailyDispatchTaskItem,
  AssignTaskPayload,
} from '../types/staffAssignment';
import {
  getManagementSupportRequests,
  getStaffWorkload,
  assignStaffToTask,
} from '../api/staffAssignmentApi';
import { IncidentDetailModal } from '../components/IncidentDetailModal';
import { AssignStaffModal } from '../components/AssignStaffModal';
import { fetchFacilities } from '@/api/facility';
import { tokenStorage } from '@/utils/tokenStorage';

const CATEGORIES: { key: SupportCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả danh mục' },
  { key: 'ACCESS_ISSUE', label: 'Kẹt cửa, hỏng khóa số / PIN' },
  { key: 'FACILITY_DAMAGE', label: 'Hư hỏng vách ngăn, trần sàn' },
  { key: 'FACILITY_LEAK', label: 'Thấm dột, ẩm mốc' },
  { key: 'CLEANLINESS', label: 'Vấn đề vệ sinh, côn trùng' },
  { key: 'PAYMENT_BILLING', label: 'Hóa đơn & phụ phí' },
  { key: 'OTHER', label: 'Yêu cầu khác' },
];

export const IncidentManagementPage: React.FC = () => {
  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number>(() => {
    const user = tokenStorage.getUser();
    return user?.facilityId ? Number(user.facilityId) : 1;
  });
  const [keyword, setKeyword] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | 'ALL'>('ALL');
  const [activeStatusTab, setActiveStatusTab] = useState<SupportStatus | 'ALL'>('ALL');
  const [onlyUrgent, setOnlyUrgent] = useState<boolean>(false);

  const [tickets, setTickets] = useState<ManagementSupportTicket[]>([]);
  const [staffList, setStaffList] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedTicketForDetail, setSelectedTicketForDetail] =
    useState<ManagementSupportTicket | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState<boolean>(false);
  const [taskForAssign, setTaskForAssign] = useState<DailyDispatchTaskItem | null>(null);

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
        const [ticketsRes, staffRes] = await Promise.all([
          getManagementSupportRequests({
            facilityId: selectedFacilityId,
            status: activeStatusTab === 'ALL' ? undefined : activeStatusTab,
            category: selectedCategory === 'ALL' ? undefined : selectedCategory,
            isUrgent: onlyUrgent ? true : undefined,
            keyword,
          }),
          getStaffWorkload(selectedFacilityId),
        ]);
        if (isMounted) {
          setTickets(ticketsRes);
          setStaffList(staffRes);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách sự cố kỹ thuật:', err);
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
  }, [selectedFacilityId, activeStatusTab, selectedCategory, onlyUrgent, keyword, reloadKey]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    const total = tickets.length;
    const openCount = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const urgentCount = tickets.filter((t) => t.isUrgent).length;
    const resolvedCount = tickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length;

    return { total, openCount, inProgressCount, urgentCount, resolvedCount };
  }, [tickets]);

  // Mở modal chi tiết
  const handleOpenDetail = (ticket: ManagementSupportTicket) => {
    setSelectedTicketForDetail(ticket);
    setDetailModalOpen(true);
  };

  // Chuyển đổi từ ticket sang task để mở AssignStaffModal
  const handleOpenAssignModal = (ticket: ManagementSupportTicket) => {
    const dispatchTask: DailyDispatchTaskItem = {
      id: ticket.id,
      taskType: 'INCIDENT',
      title: `${ticket.categoryDisplayName}: ${ticket.description.slice(0, 60)}...`,
      facilityId: ticket.facilityId,
      facilityName: ticket.facilityName,
      unitCode: ticket.storageUnitCode,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      scheduledDate: new Date(ticket.createdAt).toISOString().split('T')[0],
      scheduledTime: new Date(ticket.createdAt).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      priority: ticket.isUrgent ? 'URGENT' : 'NORMAL',
      isUrgent: ticket.isUrgent,
      assignedStaffId: ticket.assignedStaffId,
      assignedStaffName: ticket.assignedStaffName,
      status: ticket.status === 'OPEN' ? 'UNASSIGNED' : 'ASSIGNED',
      notes: ticket.assignmentNotes,
      referenceId: ticket.id,
      referenceCode: ticket.code,
    };

    setTaskForAssign(dispatchTask);
    setAssignModalOpen(true);
  };

  // Xử lý phân công nhân viên
  const handleAssignSubmit = async (payload: AssignTaskPayload) => {
    const res = await assignStaffToTask(payload);
    showToast(res.message);
    setReloadKey((k) => k + 1);
  };

  const getStatusBadge = (status: SupportStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 animate-pulse">
            Chờ tiếp nhận
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
            Đã phân công
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">
            Đang xử lý
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
            Đã giải quyết
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            Đã đóng
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/30 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bàn Điều phối Sự cố & Ticket Kỹ thuật
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-100 text-amber-800">
              SCR-FM-05
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tiếp nhận khiếu nại, phân loại sự cố hiện trường và phân công nhân viên theo SLA 2h
            (Flow 7 · UC-F7-03, UC-F7-04)
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Tổng số Ticket</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sự cố phát sinh tại cơ sở</p>
        </div>

        {/* Open */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/20 p-4 shadow-sm">
          <p className="text-xs font-semibold text-rose-700">Chờ tiếp nhận (Mới)</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{stats.openCount}</p>
          <p className="text-[11px] text-rose-600 mt-0.5">Cần phân công ngay</p>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/20 p-4 shadow-sm">
          <p className="text-xs font-semibold text-amber-800">Đang xử lý</p>
          <p className="text-2xl font-black text-amber-800 mt-1">{stats.inProgressCount}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">Nhân viên đang kiểm tra</p>
        </div>

        {/* Urgent SLA 2h */}
        <div className="bg-white rounded-2xl border border-rose-200 bg-rose-50/30 p-4 shadow-sm">
          <p className="text-xs font-semibold text-rose-800 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Khẩn cấp SLA 2h
          </p>
          <p className="text-2xl font-black text-rose-900 mt-1">{stats.urgentCount}</p>
          <p className="text-[11px] text-rose-700 mt-0.5">Cam kết BR-SUP-01</p>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 p-4 shadow-sm col-span-2 md:col-span-1">
          <p className="text-xs font-semibold text-emerald-700">Đã giải quyết</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{stats.resolvedCount}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">Khách đã nghiệm thu</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls / Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo mã ticket, ô kho, tên khách..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as SupportCategory | 'ALL')}
                className="font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgent Toggle */}
            <label className="flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUrgent}
                onChange={(e) => setOnlyUrgent(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span>Chỉ hiện vé khẩn cấp SLA 2h</span>
            </label>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b border-slate-200 px-4 bg-white overflow-x-auto text-xs font-semibold">
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'OPEN', label: 'Chờ tiếp nhận' },
            { key: 'ASSIGNED', label: 'Đã phân công' },
            { key: 'IN_PROGRESS', label: 'Đang xử lý' },
            { key: 'RESOLVED', label: 'Đã giải quyết' },
            { key: 'CLOSED', label: 'Đã đóng' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveStatusTab(tab.key as SupportStatus | 'ALL')}
              className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
                activeStatusTab === tab.key
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px]">
                <th className="py-3 px-4">Mã vé / Thời gian</th>
                <th className="py-3 px-4">Khách hàng & Ô kho</th>
                <th className="py-3 px-4">Danh mục & Nội dung</th>
                <th className="py-3 px-4">Nhân sự phụ trách</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <span>Không tìm thấy ticket nào khớp với bộ lọc</span>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Mã vé & Thời gian */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-blue-600">{ticket.code}</span>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({new Date(ticket.createdAt).toLocaleDateString('vi-VN')})
                      </p>
                      {ticket.isUrgent && (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          SLA 2h
                        </span>
                      )}
                    </td>

                    {/* Khách hàng & Ô kho */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <span>{ticket.customerName}</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                          {ticket.storageUnitCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{ticket.customerPhone}</p>
                    </td>

                    {/* Danh mục & Nội dung */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="inline-block mb-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {ticket.categoryDisplayName}
                      </span>
                      <p className="text-slate-800 font-medium line-clamp-2 leading-relaxed">
                        {ticket.description}
                      </p>
                    </td>

                    {/* Nhân sự phụ trách */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {ticket.assignedStaffName ? (
                        <div>
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                            {ticket.assignedStaffName}
                          </span>
                          {ticket.assignmentNotes && (
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                              {ticket.assignmentNotes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Chưa phân công
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(ticket)}
                          className="py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Xem chi tiết ticket"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chi tiết</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(ticket)}
                          className={`py-1.5 px-2.5 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors ${
                            ticket.assignedStaffId
                              ? 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          }`}
                        >
                          {ticket.assignedStaffId ? (
                            <>
                              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                              <span>Điều chuyển</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Phân công</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <IncidentDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        ticket={selectedTicketForDetail}
        onAssignClick={(t) => {
          setDetailModalOpen(false);
          handleOpenAssignModal(t);
        }}
      />

      <AssignStaffModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        task={taskForAssign}
        staffList={staffList}
        onAssign={handleAssignSubmit}
      />
    </div>
  );
};
