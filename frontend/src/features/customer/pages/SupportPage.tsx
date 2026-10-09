import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  LifeBuoy,
  Plus, 
  Search, 
  X,
  AlertTriangle, 
  RotateCw,
  CheckCircle2,
  Lock,
  LogIn,
  UserPlus
} from 'lucide-react';
import { tokenStorage } from '@/utils/tokenStorage';
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

export type SupportTabKey = 'ALL' | 'ACTIVE' | 'CLOSED';

export const SupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preContractId = searchParams.get('contractId') || undefined;
  const preUnitId = searchParams.get('unitId') || undefined;

  const isAuthenticated = Boolean(tokenStorage.getAccessToken());

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [rentals, setRentals] = useState<RentedContract[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<SupportTabKey>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state - Khởi tạo mở modal ngay nếu URL có preContractId/preUnitId (và đã login)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(() => Boolean(isAuthenticated && (preContractId || preUnitId)));
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [createdSuccessTicket, setCreatedSuccessTicket] = useState<SupportTicket | null>(null);
  const [cancellingTicket, setCancellingTicket] = useState<SupportTicket | null>(null);
  const [isCancellingTicket, setIsCancellingTicket] = useState<boolean>(false);
  const [cancelTicketError, setCancelTicketError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Nếu chưa đăng nhập, chỉ tải danh sách cơ sở công khai, không gọi API cần auth để tránh lỗi 403
      if (!isAuthenticated) {
        const facilitiesData = await customerApi.getFacilities();
        setFacilities(facilitiesData);
        setTickets([]);
        setRentals([]);
        return;
      }

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

    if (!isAuthenticated) {
      customerApi.getFacilities()
        .then((facilitiesData) => {
          if (isMounted) {
            setFacilities(facilitiesData);
            setTickets([]);
            setRentals([]);
            setError(null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }

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
  }, [isAuthenticated]);

  // Handle Create Submit
  const handleCreateTicket = async (payload: CreateSupportTicketPayload) => {
    if (!isAuthenticated) {
      navigate('/auth/login?redirect=/customer/support');
      return;
    }
    const created = await customerApi.createSupportRequest(payload);
    setTickets(prev => [created, ...prev]);
    setCreatedSuccessTicket(created);
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

  // Handle Confirm Cancel Ticket (ISS-79)
  const handleConfirmCancelTicket = async () => {
    if (!cancellingTicket) return;
    try {
      setIsCancellingTicket(true);
      setCancelTicketError(null);
      const ok = await customerApi.cancelSupportRequest(cancellingTicket.id);
      if (ok) {
        setTickets(prev => prev.filter(t => t.id !== cancellingTicket.id));
        setCancellingTicket(null);
        showToast('Đã hủy yêu cầu hỗ trợ thành công.');
      } else {
        setCancelTicketError('Không thể hủy yêu cầu hỗ trợ. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể hủy yêu cầu hỗ trợ.';
      setCancelTicketError(message);
    } finally {
      setIsCancellingTicket(false);
    }
  };

  // Handle Cancel Ticket directly (fallback)
  const handleCancelTicket = async (id: number) => {
    const ok = await customerApi.cancelSupportRequest(id);
    if (ok) {
      setTickets(prev => prev.filter(t => t.id !== id));
      showToast('Đã hủy yêu cầu hỗ trợ thành công.');
    }
  };

  // Handle View Detail (tải thêm chi tiết đầy đủ nếu cần)
  const handleViewDetail = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      const fullDetail = await customerApi.getSupportRequestDetail(ticket.id);
      if (fullDetail) {
        setSelectedTicket(fullDetail);
      }
    } catch {
      // Giữ nguyên ticket đã chọn
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter(t => {
    // Tab filter
    if (activeTab === 'ACTIVE') {
      if (!['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)) return false;
    } else if (activeTab === 'CLOSED') {
      if (!['CLOSED', 'AUTO_CLOSED', 'RESOLVED'].includes(t.status)) return false;
    }

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
  const countInProgress = tickets.filter(t => ['NEW', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length;
  const countClosed = tickets.filter(t => ['CLOSED', 'AUTO_CLOSED', 'RESOLVED'].includes(t.status)).length;



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

      {/* Top Banner & Live Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a1614] tracking-tight">
            Yêu Cầu Hỗ Trợ & Xử Lý Sự Cố
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Tìm mã vé, ô kho..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-7 py-1.5 h-9 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer h-9"
            title="Tải lại danh sách"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                navigate('/auth/login?redirect=/customer/support');
                return;
              }
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer h-9 bg-brand-600 hover:bg-brand-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Báo sự cố mới</span>
          </Button>
        </div>
      </div>

      {!isAuthenticated ? (
        /* Card Yêu cầu đăng nhập cho khách vãng lai */
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-white to-slate-50 border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto text-brand-600 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              Vui lòng đăng nhập để xem và gửi yêu cầu hỗ trợ
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn cần đăng nhập tài khoản khách hàng để xem danh sách vé hỗ trợ của các ô kho đang thuê, gửi yêu cầu sự cố khẩn cấp và theo dõi tiến độ xử lý trực tiếp.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/auth/login?redirect=/customer/support" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Đăng nhập ngay
              </Button>
            </Link>
            <Link to="/auth/register" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                Đăng ký tài khoản
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>

          {/* Status Tabs (Clean Pills matching MyUnitsPage) */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold border-b border-slate-200/80 pb-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-brand-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Tất cả</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'ALL' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {tickets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ACTIVE'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Đang xử lý</span>
              {countInProgress > 0 && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTab === 'ACTIVE' ? 'bg-white' : 'bg-amber-500 animate-pulse'
                  }`}
                />
              )}
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'ACTIVE' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {countInProgress}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CLOSED')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'CLOSED'
                  ? 'bg-slate-800 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Đã đóng</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'CLOSED' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {countClosed}
              </span>
            </button>
          </div>

          {/* Ticket Cards List */}
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-brand-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Đang tải danh sách vé hỗ trợ...</p>
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredTickets.map((ticket) => (
                <SupportTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onViewDetail={handleViewDetail}
                  onCancel={(t) => {
                    setCancelTicketError(null);
                    setCancellingTicket(t);
                  }}
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
                  {searchQuery || activeTab !== 'ALL'
                    ? 'Không tìm thấy vé nào phù hợp với bộ lọc hiện tại của bạn.'
                    : 'Mọi ô kho của bạn đều đang hoạt động tốt. Khi gặp bất kỳ sự cố nào, hãy nhấn nút bên dưới.'}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('ALL');
                  setSearchQuery('');
                  setIsCreateOpen(true);
                }}
                className="mt-2 text-xs font-bold"
              >
                Tạo yêu cầu hỗ trợ mới
              </Button>
            </Card>
          )}
        </>
      )}


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

      {/* Modal Thông báo Tạo vé Hỗ trợ Thành công (ISS-79) */}
      <Modal
        isOpen={Boolean(createdSuccessTicket)}
        onClose={() => setCreatedSuccessTicket(null)}
        className="max-w-md w-full text-center"
      >
        <div className="p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">
              Gửi yêu cầu hỗ trợ thành công!
            </h3>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold">
              Mã vé: {createdSuccessTicket?.ticketCode}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              Yêu cầu sự cố của bạn đã được ghi nhận vào hệ thống. Nhân viên trực cơ sở sẽ tiếp nhận và tiến hành xử lý trong thời gian sớm nhất.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreatedSuccessTicket(null)}
              className="w-full sm:w-auto text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const target = createdSuccessTicket;
                setCreatedSuccessTicket(null);
                if (target) handleViewDetail(target);
              }}
              className="w-full sm:w-auto font-bold cursor-pointer"
            >
              Xem chi tiết & Tiến trình
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Xác nhận Hủy Yêu Cầu Hỗ Trợ (ISS-79) */}
      <Modal
        isOpen={Boolean(cancellingTicket)}
        onClose={() => {
          if (!isCancellingTicket) setCancellingTicket(null);
        }}
        className="max-w-md w-full"
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Xác nhận hủy yêu cầu hỗ trợ
            </h3>
            <button
              type="button"
              disabled={isCancellingTicket}
              onClick={() => setCancellingTicket(null)}
              className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 mb-1">
                Bạn có chắc chắn muốn hủy vé hỗ trợ {cancellingTicket?.ticketCode}?
              </p>
              <p className="text-rose-700">
                Thao tác này sẽ đóng yêu cầu hỗ trợ và nhân viên cơ sở sẽ không tiếp tục xử lý sự cố này nữa.
              </p>
            </div>
          </div>

          {cancelTicketError && (
            <p className="text-xs text-rose-600 font-semibold">{cancelTicketError}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCancellingTicket}
              onClick={() => setCancellingTicket(null)}
              className="text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Quay lại (Giữ vé)
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isCancellingTicket}
              onClick={handleConfirmCancelTicket}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
            >
              {isCancellingTicket ? (
                <>
                  <RotateCw className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy vé'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
