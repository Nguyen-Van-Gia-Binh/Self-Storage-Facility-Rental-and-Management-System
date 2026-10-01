import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Clock,
  Search,
  RotateCcw,
  CheckCircle2,
  Lock,
  ShieldCheck,
  User,
  Phone,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { useCurrentUser } from '@/utils/useCurrentUser';
import { getStaffIncidents, getStaffDailyTasks, startStaffIncident } from '@/api/staff';
import type { DailyIncidentTask } from '@/types';
import { StaffResolveIncidentModal } from '../components/StaffResolveIncidentModal';

export const StaffIncidentPage: React.FC = () => {
  const user = useCurrentUser();
  const [incidents, setIncidents] = useState<DailyIncidentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Modal xử lý / nghiệm thu
  const [selectedTicket, setSelectedTicket] = useState<DailyIncidentTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchIncidents = async () => {
      setLoading(true);
      try {
        const staffId = Number(user?.id) || 1;
        // 1. Lấy danh sách sự cố qua API quản lý sự cố của nhân viên
        const [mgmtRes, dailyRes] = await Promise.allSettled([
          getStaffIncidents({
            assignedStaffId: staffId,
            status: activeTab === 'ALL' ? undefined : activeTab,
          }),
          getStaffDailyTasks(staffId),
        ]);

        let combined: DailyIncidentTask[] = [];

        if (mgmtRes.status === 'fulfilled' && mgmtRes.value?.content) {
          combined = [...mgmtRes.value.content];
        }

        if (dailyRes.status === 'fulfilled' && dailyRes.value?.openSupportRequests) {
          const dailyTasks = dailyRes.value.openSupportRequests;
          dailyTasks.forEach((dt) => {
            const exists = combined.some(
              (c) => c.ticketId === dt.ticketId || (c.code && dt.code && c.code === dt.code)
            );
            if (!exists) {
              combined.push(dt);
            }
          });
        }

        if (isMounted) {
          setIncidents(combined);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách sự cố của nhân viên:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchIncidents();
    return () => {
      isMounted = false;
    };
  }, [user?.id, activeTab, reloadKey]);

  // Bộ lọc tìm kiếm & mức độ khẩn cấp
  const filteredList = useMemo(() => {
    return incidents.filter((item) => {
      // Lọc trạng thái tab
      if (activeTab === 'ASSIGNED') {
        const isAssigned =
          item.status === 'ASSIGNED' || item.status === 'PENDING' || item.status === 'NEW';
        if (!isAssigned) return false;
      } else if (activeTab === 'IN_PROGRESS') {
        if (item.status !== 'IN_PROGRESS') return false;
      } else if (activeTab === 'RESOLVED') {
        if (item.status !== 'RESOLVED' && item.status !== 'CLOSED') return false;
      }

      // Lọc từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchCode = item.code?.toLowerCase().includes(kw);
        const matchUnit = item.unitCode?.toLowerCase().includes(kw);
        const matchCustomer = item.customerName?.toLowerCase().includes(kw);
        const matchDesc = item.description?.toLowerCase().includes(kw) || item.title?.toLowerCase().includes(kw);
        return matchCode || matchUnit || matchCustomer || matchDesc;
      }

      return true;
    });
  }, [incidents, activeTab, searchKeyword]);

  // KPI thống kê
  const stats = useMemo(() => {
    const total = incidents.length;
    const pendingCount = incidents.filter(
      (i) => i.status === 'ASSIGNED' || i.status === 'PENDING' || i.status === 'NEW'
    ).length;
    const inProgressCount = incidents.filter((i) => i.status === 'IN_PROGRESS').length;
    const resolvedCount = incidents.filter(
      (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
    ).length;
    const urgentCount = incidents.filter((i) => i.priority === 'URGENT').length;

    return { total, pendingCount, inProgressCount, resolvedCount, urgentCount };
  }, [incidents]);

  // Bắt đầu xử lý nhanh tại hiện trường
  const handleQuickStart = async (ticket: DailyIncidentTask) => {
    if (ticket.ticketId == null) {
      alert('Phiếu sự cố không có mã từ hệ thống.');
      return;
    }
    setActionLoadingId(ticket.ticketId);
    try {
      await startStaffIncident(ticket.ticketId);
      showToast(`Đã bắt đầu xử lý sự cố ${ticket.code || '#' + ticket.ticketId} tại hiện trường.`);
      setReloadKey((k) => k + 1);
    } catch (err: any) {
      alert(err?.message || 'Không thể cập nhật trạng thái sự cố.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenDetailModal = (ticket: DailyIncidentTask) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ACCESS_CODE':
        return 'Lỗi mã truy cập PIN/QR';
      case 'LOST_KEY':
        return 'Mất chìa / Cắt khóa cơ';
      case 'UNIT_DAMAGE':
      case 'DAMAGED_UNIT':
        return 'Hư hại vật lý ô kho';
      case 'OVERLOCK_D4':
      case 'OVERLOCK':
        return 'Khóa ngoài Overlock (D+4)';
      case 'CLEANING':
        return 'Vệ sinh / Ẩm mốc';
      default:
        return category || 'Sự cố vận hành';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Xử lý Sự cố & Vận hành Hiện trường</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tiếp nhận yêu cầu hỗ trợ kỹ thuật, kiểm tra thực địa và lập biên bản hoàn tất (FS-05, US-FS-05.1, US-FS-05.2)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 4 Cards KPI nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Tổng sự cố được giao</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Ca trực
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Mới được giao</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-blue-600 font-mono">{stats.pendingCount}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              Chờ xử lý
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Đang xử lý tại chỗ</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 font-mono">{stats.inProgressCount}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
              Hiện trường
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Đã hoàn tất</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 font-mono">{stats.resolvedCount}</span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
              Đã đóng
            </span>
          </div>
        </div>
      </div>

      {/* Thanh bộ lọc & Tìm kiếm */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('ASSIGNED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeTab === 'ASSIGNED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Mới được giao ({stats.pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeTab === 'IN_PROGRESS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đang xử lý ({stats.inProgressCount})
            </button>
            <button
              onClick={() => setActiveTab('RESOLVED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                activeTab === 'RESOLVED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đã xong ({stats.resolvedCount})
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo mã sự cố (SUP-...), mã ô kho, tên khách hàng hoặc nội dung..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
          />
        </div>
      </div>

      {/* Danh sách Thẻ sự cố */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" />
          <p className="text-xs text-slate-500 mt-2">Đang tải danh sách sự cố ca trực...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Không có sự cố nào tồn đọng</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tất cả các yêu cầu hỗ trợ và sự cố vận hành đã được giải quyết hoặc không khớp với bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => {
            const isItemPending =
              item.status === 'ASSIGNED' || item.status === 'PENDING' || item.status === 'NEW';
            const isItemInProgress = item.status === 'IN_PROGRESS';
            const isItemResolved = item.status === 'RESOLVED' || item.status === 'CLOSED';

            return (
              <div
                key={item.ticketId || item.code}
                className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 p-5 shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                        {item.code || `SUP-${item.ticketId}`}
                      </span>
                    </div>

                    {isItemPending && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Mới được giao
                      </span>
                    )}
                    {isItemInProgress && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Đang xử lý
                      </span>
                    )}
                    {isItemResolved && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đã khắc phục
                      </span>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div>
                    <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider block">
                      {getCategoryLabel(item.category)}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug line-clamp-2">
                      {item.title || item.description}
                    </h3>
                  </div>

                  {/* Info badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Kho:</span>
                      <strong className="font-mono text-teal-700">{item.unitCode || '---'}</strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Tiếp nhận:</span>
                      <strong className="text-slate-700">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : 'Trong ca'}
                      </strong>
                    </div>

                    {item.customerName && (
                      <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Khách:</span>
                        <strong className="text-slate-800">{item.customerName}</strong>
                        {item.customerPhone && (
                          <a
                            href={`tel:${item.customerPhone}`}
                            className="ml-auto font-mono text-teal-700 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            {item.customerPhone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description preview */}
                  {item.description && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl line-clamp-2 border border-slate-100">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDetailModal(item)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                  >
                    <span>Chi tiết</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isItemPending && (
                      <button
                        type="button"
                        onClick={() => handleQuickStart(item)}
                        disabled={actionLoadingId === item.ticketId}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                      >
                        {actionLoadingId === item.ticketId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>Bắt đầu xử lý</span>
                      </button>
                    )}

                    {isItemInProgress && (
                      <button
                        type="button"
                        onClick={() => handleOpenDetailModal(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Nghiệm thu & Hoàn thành</span>
                      </button>
                    )}

                    {isItemResolved && (
                      <button
                        type="button"
                        onClick={() => handleOpenDetailModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1"
                      >
                        <span>Xem kết quả</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xử lý & Nghiệm thu Sự cố */}
      <StaffResolveIncidentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={selectedTicket}
        onSuccess={() => {
          showToast('Cập nhật trạng thái sự cố thành công!');
          setReloadKey((k) => k + 1);
        }}
      />
    </div>
  );
};
