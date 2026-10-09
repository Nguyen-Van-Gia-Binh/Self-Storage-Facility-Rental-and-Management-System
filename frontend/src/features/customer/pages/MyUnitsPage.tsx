import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Plus,
  Layers,
  Search,
  X,
  RotateCcw,
  Lock,
  LogIn,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { tokenStorage } from '@/utils/tokenStorage';
import { RentedUnitCard } from '../components/RentedUnitCard';
import { PendingReservationCard } from '../components/PendingReservationCard';
import { ChangePinModal } from '../components/ChangePinModal';
import { ScheduleReturnModal } from '../components/ScheduleReturnModal';
import { ContractDetailModal } from '../components/ContractDetailModal';
import { EarlyRenewalReminderModal } from '../components/EarlyRenewalReminderModal';
import { VietQRPaymentModal } from '../components/VietQRPaymentModal';
import { getCustomerContracts } from '@/api/customerRentals';
import { getMyReservationsApi, cancelReservationApi, type ReservationResponse } from '@/api/reservation';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { parseReminderDays, shouldRemindRenewal } from '../utils/policyTerms';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import type { RentedContract } from '../types';

export const MyUnitsPage: React.FC = () => {
  const isAuthenticated = Boolean(tokenStorage.getAccessToken());
  const policy = useActivePolicy();
  const noticeDays = policy?.returnNoticeDays ?? 0;
  const reminderDays = useMemo(() => parseReminderDays(policy?.renewalReminderDays), [policy]);

  const [contracts, setContracts] = useState<RentedContract[]>([]);
  const [pendingReservations, setPendingReservations] = useState<ReservationResponse[]>([]);
  const [cancellingReservation, setCancellingReservation] = useState<ReservationResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedPinContract, setSelectedPinContract] = useState<RentedContract | null>(null);
  const [selectedReturnContract, setSelectedReturnContract] = useState<RentedContract | null>(null);
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentedContract | null>(null);
  const [selectedOverdueContract, setSelectedOverdueContract] = useState<RentedContract | null>(null);
  const [earlyRenewalContract, setEarlyRenewalContract] = useState<RentedContract | null>(null);
  const [showEarlyRenewalModal, setShowEarlyRenewalModal] = useState(false);

  const loadContracts = useCallback(async () => {
    if (!isAuthenticated) {
      setContracts([]);
      setPendingReservations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [contractsData, reservationsData] = await Promise.all([
        getCustomerContracts(),
        getMyReservationsApi().catch((err) => {
          console.warn('Lỗi tải danh sách reservations:', err);
          return [] as ReservationResponse[];
        }),
      ]);
      setContracts(contractsData);

      // Lọc các đơn đang ở trạng thái PENDING_PAYMENT và chưa hết hạn giữ chỗ
      const activePending = reservationsData.filter((r) => {
        if (r.status !== 'PENDING_PAYMENT') return false;
        if (r.holdExpiresAt && new Date(r.holdExpiresAt).getTime() <= Date.now()) return false;
        return true;
      });
      setPendingReservations(activePending);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng & đơn đặt chỗ:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Handler hủy đơn giữ chỗ từ trang My Units
  const handleConfirmCancelReservation = async () => {
    if (!cancellingReservation) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelReservationApi(cancellingReservation.id, 'Khách hàng hủy giữ chỗ từ trang Kho của tôi');
      setCancellingReservation(null);
      loadContracts();
    } catch (err: any) {
      console.error('Lỗi hủy đơn giữ chỗ:', err);
      setCancelError(err?.message || 'Không thể hủy đơn đặt chỗ. Vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handler khi đổi mã PIN thành công
  const handlePinChanged = (contractId: string, newPin: string) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, accessPin: newPin } : c))
    );
  };

  // Handler khi đăng ký trả kho thành công
  const handleReturnScheduled = (contractId: string, returnDate: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? { ...c, status: 'PENDING_RETURN', scheduledReturnDate: returnDate }
          : c
      )
    );
    loadContracts();
  };

  // Lọc theo Tab và Search Query
  const filteredContracts = useMemo(() => {
    if (activeTab === 'PENDING_PAYMENT') return [];
    return contracts
      .filter((contract) => {
        // 1. Lọc theo Tab
        if (activeTab === 'ACTIVE' && contract.status !== 'ACTIVE') return false;
        if (
          activeTab === 'PENDING_CHECKIN' &&
          contract.status !== 'PENDING_CHECKIN' &&
          (contract.status as string) !== 'PENDING_CHECK_IN'
        )
          return false;
        if (activeTab === 'ATTENTION') {
          const isAttention =
            contract.status === 'EXPIRING_SOON' ||
            contract.status === 'OVERDUE' ||
            contract.status === 'PENDING_RETURN';
          if (!isAttention) return false;
        }
        if (activeTab === 'CLOSED' && contract.status !== 'CLOSED' && contract.status !== 'TERMINATED') {
          return false;
        }

        // 2. Lọc theo từ khóa tìm kiếm
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchUnit = (contract.unitNumber || '').toLowerCase().includes(q);
          const matchFacility = (contract.facilityName || '').toLowerCase().includes(q);
          const matchContract = (contract.contractNumber || '').toLowerCase().includes(q);
          const matchType = (contract.unitTypeName || '').toLowerCase().includes(q);
          if (!matchUnit && !matchFacility && !matchContract && !matchType) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        const idA = parseInt(a.id, 10);
        const idB = parseInt(b.id, 10);
        if (!isNaN(idA) && !isNaN(idB)) return idB - idA;
        return (b.contractNumber || '').localeCompare(a.contractNumber || '');
      });
  }, [contracts, activeTab, searchQuery]);

  // Lọc danh sách đơn đang giữ chỗ theo search query
  const filteredPendingReservations = useMemo(() => {
    if (activeTab !== 'ALL' && activeTab !== 'PENDING_PAYMENT') return [];
    return pendingReservations.filter((rsv) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchUnit = (rsv.storageUnitCode || '').toLowerCase().includes(q);
      const matchFacility = (rsv.facilityName || '').toLowerCase().includes(q);
      const matchCode = (rsv.code || '').toLowerCase().includes(q);
      const matchTypeName = (rsv.unitTypeName || '').toLowerCase().includes(q);
      return matchUnit || matchFacility || matchCode || matchTypeName;
    });
  }, [pendingReservations, activeTab, searchQuery]);

  const earlyRenewalCandidate = useMemo(() => {
    if (!policy) return null;
    return (
      contracts.find((c) => {
        if (c.status !== 'ACTIVE') return false;
        return shouldRemindRenewal(calculateDaysRemaining(c.endDate), noticeDays, reminderDays);
      }) || null
    );
  }, [contracts, policy, noticeDays, reminderDays]);

  // Tự động bung Pop-up nếu chưa bị dismiss trong phiên
  useEffect(() => {
    if (!earlyRenewalCandidate) return;
    const isDismissed = sessionStorage.getItem(`early_renewal_dismissed_${earlyRenewalCandidate.id}`) === 'true';
    if (!isDismissed) {
      setEarlyRenewalContract(earlyRenewalCandidate);
      setShowEarlyRenewalModal(true);
    }
  }, [earlyRenewalCandidate]);

  const handleCloseEarlyRenewalModal = () => {
    if (earlyRenewalContract) {
      sessionStorage.setItem(`early_renewal_dismissed_${earlyRenewalContract.id}`, 'true');
    }
    setShowEarlyRenewalModal(false);
  };

  const totalDisplayItems = filteredContracts.length + filteredPendingReservations.length;

  const activeCount = useMemo(() => contracts.filter((c) => c.status === 'ACTIVE').length, [contracts]);
  const pendingCheckinCount = useMemo(
    () =>
      contracts.filter(
        (c) => c.status === 'PENDING_CHECKIN' || (c.status as string) === 'PENDING_CHECK_IN'
      ).length,
    [contracts]
  );
  const attentionCount = useMemo(
    () =>
      contracts.filter(
        (c) =>
          c.status === 'EXPIRING_SOON' || c.status === 'OVERDUE' || c.status === 'PENDING_RETURN'
      ).length,
    [contracts]
  );
  const closedCount = useMemo(
    () => contracts.filter((c) => c.status === 'CLOSED' || c.status === 'TERMINATED').length,
    [contracts]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Banner & Live Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a1614] tracking-tight">
            Kho Của Tôi
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Input
              placeholder="Tìm mã kho, cơ sở, mã HĐ..."
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
            onClick={loadContracts}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold cursor-pointer h-9"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Link to="/customer">
            <Button
              variant="primary"
              size="sm"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Thuê thêm ô kho</span>
            </Button>
          </Link>
        </div>
      </div>

      {!isAuthenticated ? (
        /* Card Yêu cầu đăng nhập cho khách vãng lai */
        <Card className="p-8 sm:p-12 text-center bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4 max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto text-brand-600 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Vui lòng đăng nhập để xem kho của tôi
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
              Bạn cần đăng nhập tài khoản khách hàng để tra cứu danh sách các ô kho đang thuê, xem mã PIN mở cửa, gia hạn hợp đồng hoặc đăng ký trả kho.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/auth/login?redirect=/customer/my-units" className="w-full sm:w-auto">
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
            <Link to="/customer" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full font-bold text-xs flex items-center justify-center gap-2 text-brand-600 border-brand-200 hover:bg-brand-50">
                <Plus className="w-4 h-4" />
                Tìm ô kho mới
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          {/* Status Filter Tabs (Clean Pills matching SupportPage) */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold border-b border-slate-200/80 pb-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ACTIVE'
                  ? 'bg-brand-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Đang hoạt động</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'ACTIVE' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ATTENTION')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ATTENTION'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Cần gia hạn</span>
              {attentionCount > 0 && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTab === 'ATTENTION' ? 'bg-white' : 'bg-amber-500 animate-pulse'
                  }`}
                />
              )}
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'ATTENTION' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {attentionCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PENDING_CHECKIN')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'PENDING_CHECKIN'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Chờ nhận kho</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'PENDING_CHECKIN' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {pendingCheckinCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PENDING_PAYMENT')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'PENDING_PAYMENT'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>Giữ chỗ 48h</span>
              {pendingReservations.length > 0 && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    activeTab === 'PENDING_PAYMENT' ? 'bg-white' : 'bg-rose-500'
                  }`}
                />
              )}
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'PENDING_PAYMENT' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {pendingReservations.length}
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
              <span>Đã kết thúc</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  activeTab === 'CLOSED' ? 'bg-white/25 text-white' : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {closedCount}
              </span>
            </button>
          </div>

          {/* List of Compact Master Rows */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              Đang tải dữ liệu danh sách ô kho...
            </div>
          ) : totalDisplayItems > 0 ? (
            <div className="space-y-3">
              {/* 1. Render Đơn đang giữ chỗ 48h */}
              {filteredPendingReservations.map((rsv) => (
                <PendingReservationCard
                  key={`rsv-${rsv.id}`}
                  reservation={rsv}
                  onCancel={(r) => setCancellingReservation(r)}
                />
              ))}

              {/* 2. Render Hợp đồng thuê kho */}
              {filteredContracts.map((contract) => (
                <RentedUnitCard
                  key={contract.id}
                  contract={contract}
                  onChangePin={(c) => setSelectedPinContract(c)}
                  onScheduleReturn={(c) => setSelectedReturnContract(c)}
                  onViewDetail={(c) => setSelectedDetailContract(c)}
                  onOpenOverduePayment={(c) => setSelectedOverdueContract(c)}
                  onCancelReturn={() => loadContracts()}
                  renewalNoticeDays={noticeDays > 0 ? noticeDays : undefined}
                />
              ))}
            </div>
          ) : (
            <Card className="p-10 text-center bg-white border border-slate-200/90 rounded-2xl space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#0a1614]">
                  {searchQuery ? 'Không tìm thấy ô kho nào phù hợp' : 'Không có ô kho nào trong mục này'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery
                    ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử tìm kiếm khác.`
                    : 'Bạn chưa có đơn đặt chỗ hoặc hợp đồng nào tương ứng với danh mục đã chọn.'}
                </p>
              </div>
              {searchQuery ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-1 text-xs font-semibold cursor-pointer"
                >
                  Xóa bộ lọc tìm kiếm
                </Button>
              ) : (
                <Link to="/customer">
                  <Button variant="primary" size="sm" className="mt-1 text-xs font-bold cursor-pointer">
                    Khám phá và thuê ô kho mới
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </>
      )}

      {/* Modals Management */}
      <ChangePinModal
        isOpen={Boolean(selectedPinContract)}
        onClose={() => setSelectedPinContract(null)}
        contract={selectedPinContract}
        onPinChanged={handlePinChanged}
      />

      <ScheduleReturnModal
        isOpen={Boolean(selectedReturnContract)}
        onClose={() => setSelectedReturnContract(null)}
        contract={selectedReturnContract}
        onReturnScheduled={handleReturnScheduled}
      />

      <ContractDetailModal
        isOpen={Boolean(selectedDetailContract)}
        onClose={() => setSelectedDetailContract(null)}
        contract={selectedDetailContract}
        onScheduleReturn={(c) => setSelectedReturnContract(c)}
        onChangePin={(c) => setSelectedPinContract(c)}
      />

      <EarlyRenewalReminderModal
        isOpen={showEarlyRenewalModal}
        onClose={handleCloseEarlyRenewalModal}
        contract={earlyRenewalContract}
        noticeDays={noticeDays}
        reminderDays={reminderDays}
      />

      {selectedOverdueContract && (
        <VietQRPaymentModal
          isOpen={Boolean(selectedOverdueContract)}
          onClose={() => setSelectedOverdueContract(null)}
          onPaymentSuccess={() => {
            setSelectedOverdueContract(null);
            loadContracts();
          }}
          unitNumber={selectedOverdueContract.unitNumber}
          facilityName={selectedOverdueContract.facilityName}
          totalAmount={selectedOverdueContract.overdueFee || 0}
          contractId={Number(selectedOverdueContract.id)}
          paymentType="OVERDUE_PENALTY"
        />
      )}

      {/* Modal Xác nhận Hủy giữ chỗ */}
      <Modal
        isOpen={Boolean(cancellingReservation)}
        onClose={() => {
          if (!isCancelling) setCancellingReservation(null);
        }}
        className="max-w-md w-full"
      >
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Xác nhận hủy giữ chỗ
            </h3>
            <button
              type="button"
              disabled={isCancelling}
              onClick={() => setCancellingReservation(null)}
              className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-xs leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900 mb-1">Bạn có chắc chắn muốn hủy giữ chỗ?</p>
              <p className="text-rose-700">
                Sau khi hủy, ô kho <strong>{cancellingReservation?.storageUnitCode || cancellingReservation?.unitTypeName}</strong> sẽ được giải phóng ngay lập tức trên hệ thống và bạn cần tạo đơn mới nếu muốn thuê lại.
              </p>
            </div>
          </div>

          {cancelError && (
            <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isCancelling}
              onClick={() => setCancellingReservation(null)}
              className="text-slate-700 hover:bg-slate-100"
            >
              Quay lại (Giữ đơn)
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isCancelling}
              onClick={handleConfirmCancelReservation}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isCancelling ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-1.5 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy giữ chỗ'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
