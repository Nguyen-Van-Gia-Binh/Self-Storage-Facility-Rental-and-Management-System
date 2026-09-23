import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  LifeBuoy, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw,
  Sparkles,
  Clock
} from 'lucide-react';
import type { 
  SupportTicket, 
  RentedContract,
  Facility,
  CreateSupportTicketPayload
} from '../types';
import { customerApi } from '../api/customerApi';
import { SupportTicketCard } from '../components/SupportTicketCard';
import { SupportTicketDetailModal } from '../components/SupportTicketDetailModal';
import { CreateSupportTicketModal } from '../components/CreateSupportTicketModal';
import { SupportFaqSection } from '../components/SupportFaqSection';

export type SupportTabKey = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';

export const SupportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preContractId = searchParams.get('contractId') || undefined;
  const preUnitId = searchParams.get('unitId') || undefined;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [rentals, setRentals] = useState<RentedContract[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<SupportTabKey>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state - Khởi tạo mở modal ngay nếu URL có preContractId/preUnitId
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(() => Boolean(preContractId || preUnitId));
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketsData, rentalsData, facilitiesData] = await Promise.all([
        customerApi.getMySupportRequests(),
        customerApi.getMyRentals(),
        customerApi.getFacilities(),
      ]);
      setTickets(ticketsData);
      setRentals(rentalsData);
      setFacilities(facilitiesData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu vé hỗ trợ.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      customerApi.getMySupportRequests(),
      customerApi.getMyRentals(),
      customerApi.getFacilities(),
    ])
      .then(([ticketsData, rentalsData, facilitiesData]) => {
        if (isMounted) {
          setTickets(ticketsData);
          setRentals(rentalsData);
          setFacilities(facilitiesData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu vé hỗ trợ.';
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Create Submit
  const handleCreateTicket = async (payload: CreateSupportTicketPayload) => {
    const created = await customerApi.createSupportRequest(payload);
    setTickets(prev => [created, ...prev]);
    showToast(`Đã tạo yêu cầu hỗ trợ thành công (Mã: ${created.ticketCode})`);
  };

  // Handle Confirm Resolution
  const handleConfirmResolution = async (id: number, satisfied: boolean, feedbackNotes?: string) => {
    const updated = await customerApi.confirmResolution(id, satisfied, feedbackNotes);
    setTickets(prev => prev.map(t => (t.id === id ? updated : t)));
    if (satisfied) {
      showToast('Đã xác nhận nghiệm thu và hoàn tất đóng vé hỗ trợ.');
    } else {
      showToast('Đã chuyển phản hồi tới nhân viên để tiếp tục kiểm tra xử lý.', 'error');
    }
  };

  // Handle Cancel Ticket
  const handleCancelTicket = async (id: number) => {
    const ok = await customerApi.cancelSupportRequest(id);
    if (ok) {
      setTickets(prev => prev.filter(t => t.id !== id));
      showToast('Đã hủy yêu cầu hỗ trợ thành công.');
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    // Tab filter
    if (activeTab === 'ACTIVE') {
      if (!['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)) return false;
    } else if (activeTab === 'RESOLVED') {
      if (t.status !== 'RESOLVED') return false;
    } else if (activeTab === 'CLOSED') {
      if (!['CLOSED', 'AUTO_CLOSED'].includes(t.status)) return false;
    }

    // Category filter
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = t.ticketCode.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchUnit = t.unitNumber?.toLowerCase().includes(q) || false;
      const matchFacility = t.facilityName.toLowerCase().includes(q);
      if (!matchCode && !matchDesc && !matchUnit && !matchFacility) return false;
    }

    return true;
  });

  // Metrics count
  const countWaitingConfirm = tickets.filter(t => t.status === 'RESOLVED').length;
  const countInProgress = tickets.filter(t => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const countClosed = tickets.filter(t => ['CLOSED', 'AUTO_CLOSED'].includes(t.status)).length;

  const kpis = [
    {
      tab: 'ACTIVE' as SupportTabKey,
      title: 'Đang xử lý',
      count: countInProgress,
      subtext: 'Nhân viên đang phối hợp xử lý',
      icon: Clock,
      bgGradient: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-200/80',
      activeBorder: 'border-amber-600 ring-2 ring-amber-500/20',
      textColor: 'text-amber-950',
      iconColor: 'text-amber-600',
    },
    {
      tab: 'RESOLVED' as SupportTabKey,
      title: 'Chờ nghiệm thu',
      count: countWaitingConfirm,
      subtext: 'Đã hoàn thành, cần bạn xác nhận',
      icon: Sparkles,
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-200/80',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/20',
      textColor: 'text-emerald-950',
      iconColor: 'text-emerald-600',
    },
    {
      tab: 'CLOSED' as SupportTabKey,
      title: 'Đã hoàn tất',
      count: countClosed,
      subtext: 'Yêu cầu hỗ trợ đã đóng',
      icon: CheckCircle2,
      bgGradient: 'from-slate-500/10 to-slate-500/5',
      borderColor: 'border-slate-200/80',
      activeBorder: 'border-slate-600 ring-2 ring-slate-500/20',
      textColor: 'text-slate-900',
      iconColor: 'text-slate-600',
    },
    {
      tab: 'ALL' as SupportTabKey,
      title: 'Tổng yêu cầu',
      count: tickets.length,
      subtext: 'Tổng số vé hỗ trợ đã tạo',
      icon: LifeBuoy,
      bgGradient: 'from-brand-500/10 to-blue-500/5',
      borderColor: 'border-brand-200/80',
      activeBorder: 'border-brand-600 ring-2 ring-brand-500/20',
      textColor: 'text-brand-900',
      iconColor: 'text-brand-600',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-900 text-white border-emerald-700' 
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            Thử lại
          </Button>
        </div>
      )}

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-brand-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Trung Tâm Chăm Sóc & Hỗ Trợ Kỹ Thuật</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Yêu Cầu Hỗ Trợ & Xử Lý Sự Cố
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Gửi phản ánh về ổ khóa, mã PIN, hư hỏng kho hoặc thanh toán. Nhân viên cơ sở sẽ tiếp nhận và xử lý tại chỗ kịp thời.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white shadow-xs font-bold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Báo sự cố mới
          </Button>
        </div>
      </div>

      {/* Quick Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isSelected = activeTab === kpi.tab;

          return (
            <div
              key={kpi.title}
              onClick={() => setActiveTab(kpi.tab)}
              className={`p-4 rounded-2xl bg-gradient-to-br ${kpi.bgGradient} bg-white border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md relative overflow-hidden group ${
                isSelected ? kpi.activeBorder : kpi.borderColor
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-xl bg-white shadow-xs ${kpi.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black tracking-tight ${kpi.textColor}`}>
                  {kpi.count}
                </span>
                <span className="text-xs font-semibold text-slate-400">vé</span>
              </div>

              <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                {kpi.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Action banner if any ticket is waiting for customer confirmation (US-SC-06.3) */}
      {countWaitingConfirm > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                Bạn có {countWaitingConfirm} yêu cầu hỗ trợ đã được nhân viên khắc phục xong!
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                Vui lòng kiểm tra thực tế và xác nhận nghiệm thu để đóng vé hoặc báo nếu chưa khắc phục triệt để.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('RESOLVED')}
            className="bg-white text-emerald-900 hover:bg-emerald-50 border-transparent font-bold text-xs shrink-0"
          >
            Xem vé chờ nghiệm thu
          </Button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
          {/* Status Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto text-xs font-semibold">
            {(
              [
                { key: 'ALL', label: `Tất cả (${tickets.length})` },
                { key: 'ACTIVE', label: `Đang xử lý (${countInProgress})` },
                { key: 'RESOLVED', label: `Chờ nghiệm thu (${countWaitingConfirm})` },
                { key: 'CLOSED', label: `Đã đóng (${countClosed})` },
              ] as const satisfies readonly { key: SupportTabKey; label: string }[]
            ).map(tab => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-3 px-1 border-b-2 transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'border-brand-600 text-brand-700 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Category Filter & Search Box */}
          <div className="flex items-center gap-2 pb-2 sm:pb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã vé, ô kho..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 w-36 sm:w-48"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">Mọi danh mục</option>
              <option value="LOCK_ACCESS">Khóa & PIN</option>
              <option value="UNIT_DAMAGE">Hư hỏng kho</option>
              <option value="PAYMENT">Thanh toán</option>
              <option value="BELONGINGS">Tài sản</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticket Cards List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RotateCw className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Đang tải danh sách vé hỗ trợ...</p>
        </div>
      ) : filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {filteredTickets.map((ticket) => (
            <SupportTicketCard
              key={ticket.id}
              ticket={ticket}
              onViewDetail={(t) => setSelectedTicket(t)}
              onConfirmResolution={(t) => setSelectedTicket(t)}
              onCancel={(t) => handleCancelTicket(t.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center bg-white border border-slate-200/90 rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Không có yêu cầu hỗ trợ nào
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || categoryFilter !== 'ALL' || activeTab !== 'ALL'
                ? 'Không tìm thấy vé nào phù hợp với bộ lọc hiện tại của bạn.'
                : 'Mọi ô kho của bạn đều đang hoạt động tốt. Khi gặp bất kỳ sự cố nào, hãy nhấn nút bên dưới.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setActiveTab('ALL');
              setCategoryFilter('ALL');
              setSearchQuery('');
              setIsCreateOpen(true);
            }}
            className="mt-2 text-xs font-bold"
          >
            Tạo yêu cầu hỗ trợ mới
          </Button>
        </Card>
      )}

      {/* Support FAQ & Business Rules Section */}
      <SupportFaqSection />

      {/* Modals */}
      <CreateSupportTicketModal
        key={String(isCreateOpen) + (preContractId || '') + (preUnitId || '')}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        rentals={rentals}
        facilities={facilities}
        preselectedContractId={preContractId}
        preselectedUnitId={preUnitId}
        onSubmit={handleCreateTicket}
      />

      <SupportTicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onConfirmResolution={handleConfirmResolution}
        onCancelTicket={handleCancelTicket}
      />
    </div>
  );
};
