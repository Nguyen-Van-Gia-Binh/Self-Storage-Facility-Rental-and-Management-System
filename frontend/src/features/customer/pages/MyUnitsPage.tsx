import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Plus,
  Search,
  X,
  RotateCcw,
  AlertTriangle,
  Filter,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { MyUnitsGuestPrompt } from '../components/MyUnitsGuestPrompt';
// Unified table view replaces standalone RentedUnitCard and PendingReservationCard
import { MyUnitsTable } from '../components/MyUnitsTable';
import { MyUnitsModals } from '../components/MyUnitsModals';
import { useCustomerContracts } from '../hooks/useCustomerContracts';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { cancelContractReturn } from '@/api/customerRentals';
import type { RentedContract } from '../types';

export const MyUnitsPage: React.FC = () => {
  // 1. Quản lý dữ liệu hợp đồng & đơn giữ chỗ qua Custom Hook
  // Integration with getMyReservationsApi
  const {
    isAuthenticated,
    noticeDays,
    reminderDays,
    contracts,
    pendingReservations,
    loading,
    loadContracts,
    cancellingReservation,
    setCancellingReservation,
    isCancelling,
    cancelError,
    handleConfirmCancelReservation,
    handlePinChanged,
    handleReturnScheduled,
    earlyRenewalContract,
    showEarlyRenewalModal,
    handleCloseEarlyRenewalModal,
    activeCount,
    expiringCount,
    overdueCount,
    pendingReturnCount,
    pendingCheckinCount,
    closedCount,
  } = useCustomerContracts();

  // 2. Trạng thái bộ lọc (Tab, Search, Date Filter)
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);

  const [dateFilter, setDateFilter] = useState<'ALL' | 'UPCOMING_30' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState<boolean>(false);

  // 3. Trạng thái lựa chọn hiển thị các Modals
  const [selectedPinContract, setSelectedPinContract] = useState<RentedContract | null>(null);
  const [selectedReturnContract, setSelectedReturnContract] = useState<RentedContract | null>(null);
  const [selectedDetailContract, setSelectedDetailContract] = useState<RentedContract | null>(null);
  const [selectedRescheduleContract, setSelectedRescheduleContract] = useState<RentedContract | null>(null);
  const [selectedOverdueContract, setSelectedOverdueContract] = useState<RentedContract | null>(null);
  const [selectedCancelCheckInContract, setSelectedCancelCheckInContract] = useState<RentedContract | null>(null);
  const [selectedCancelReturnContract, setSelectedCancelReturnContract] = useState<RentedContract | null>(null);
  const [isCancellingReturn, setIsCancellingReturn] = useState<boolean>(false);
  const [cancelReturnError, setCancelReturnError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmCancelReturn = async () => {
    if (!selectedCancelReturnContract) return;
    try {
      setIsCancellingReturn(true);
      setCancelReturnError(null);
      await cancelContractReturn(selectedCancelReturnContract.id);
      showToast('Đã hủy yêu cầu trả kho thành công. Hợp đồng tiếp tục hoạt động.');
      setSelectedCancelReturnContract(null);
      await loadContracts();
    } catch (err: any) {
      setCancelReturnError(err?.message || 'Không thể hủy yêu cầu trả kho. Vui lòng thử lại.');
    } finally {
      setIsCancellingReturn(false);
    }
  };

  // 4. Lọc danh sách hợp đồng theo Tab, Search Query và Date Filter (ISS-106)
  const filteredContracts = useMemo(() => {
    if (activeTab === 'PENDING_PAYMENT') return [];
    return contracts
      .filter((contract) => {
        // 1. Lọc theo Tab (Phương án A: Rành rọt từng trạng thái nghiệp vụ)
        if (activeTab === 'ACTIVE' && contract.status !== 'ACTIVE') return false;
        if (activeTab === 'OVERDUE' && contract.status !== 'OVERDUE') return false;
        if (activeTab === 'PENDING_RETURN' && contract.status !== 'PENDING_RETURN') return false;
        if (
          activeTab === 'PENDING_CHECKIN' &&
          contract.status !== 'PENDING_CHECKIN' &&
          (contract.status as string) !== 'PENDING_CHECK_IN'
        )
          return false;
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

        // 3. Lọc theo thời hạn (Date Filter)
        if (dateFilter === 'UPCOMING_30') {
          if (contract.status === 'CLOSED' || contract.status === 'TERMINATED') return false;
          const days = calculateDaysRemaining(contract.endDate);
          if (days > 30) return false;
        } else if (dateFilter === 'THIS_MONTH') {
          if (!contract.endDate) return false;
          const endD = new Date(contract.endDate);
          const now = new Date();
          if (endD.getMonth() !== now.getMonth() || endD.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (dateFilter === 'CUSTOM') {
          if (customFromDate && contract.endDate && contract.endDate < customFromDate) return false;
          if (customToDate && contract.startDate && contract.startDate > customToDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Ưu tiên hợp đồng chưa đóng lên trước, hợp đồng đã đóng (closed) xuống cuối cùng
        const aIsClosed = a.status === 'CLOSED' || a.status === 'TERMINATED';
        const bIsClosed = b.status === 'CLOSED' || b.status === 'TERMINATED';
        if (aIsClosed !== bIsClosed) {
          return aIsClosed ? 1 : -1;
        }

        // Sắp xếp ngày sắp tới gần nhất ở phía trên (Upcoming First)
        const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        if (dateA !== dateB) return dateA - dateB;

        const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
        const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
        return startA - startB;
      });
  }, [contracts, activeTab, searchQuery, dateFilter, customFromDate, customToDate]);

  // 5. Lọc danh sách đơn đang giữ chỗ 48h
  const filteredPendingReservations = useMemo(() => {
    if (activeTab !== 'ALL' && activeTab !== 'PENDING_PAYMENT') return [];
    return pendingReservations.filter((rsv) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUnit = (rsv.storageUnitCode || '').toLowerCase().includes(q);
        const matchFacility = (rsv.facilityName || '').toLowerCase().includes(q);
        const matchCode = (rsv.code || '').toLowerCase().includes(q);
        const matchTypeName = (rsv.unitTypeName || '').toLowerCase().includes(q);
        if (!matchUnit && !matchFacility && !matchCode && !matchTypeName) return false;
      }

      if (dateFilter === 'CUSTOM') {
        if (customFromDate && rsv.startDate && rsv.startDate < customFromDate) return false;
        if (customToDate && rsv.startDate && rsv.startDate > customToDate) return false;
      }

      return true;
    });
  }, [pendingReservations, activeTab, searchQuery, dateFilter, customFromDate, customToDate]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      
      {/* TOP BANNER & BỘ LỌC TÌM KIẾM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a1614] tracking-tight">
            Kho Của Tôi
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ô Tìm Kiếm Nhanh */}
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

          {/* Dropdown Lọc Theo 6 Trạng Thái Nghiệp Vụ (ISS-106) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 h-9 bg-white border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {activeTab === 'ALL'
                  ? 'Tất cả trạng thái'
                  : activeTab === 'ACTIVE'
                  ? 'Đang hoạt động'
                  : activeTab === 'OVERDUE'
                  ? 'Quá hạn'
                  : activeTab === 'PENDING_CHECKIN'
                  ? 'Chờ nhận kho'
                  : activeTab === 'PENDING_RETURN'
                  ? 'Chờ trả kho'
                  : activeTab === 'PENDING_PAYMENT'
                  ? 'Giữ chỗ 48h'
                  : 'Đã kết thúc'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsStatusDropdownOpen(false)}
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto top-10 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-1.5 space-y-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ALL');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'ALL'
                        ? 'bg-brand-50 text-brand-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Tất cả ô kho</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                      {contracts.length + pendingReservations.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ACTIVE');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Đang hoạt động</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      {activeCount}
                      {expiringCount > 0 ? ` (${expiringCount} sắp hết)` : ''}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('OVERDUE');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'OVERDUE'
                        ? 'bg-rose-50 text-rose-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Quá hạn</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                      {overdueCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('PENDING_CHECKIN');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'PENDING_CHECKIN'
                        ? 'bg-blue-50 text-blue-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Chờ nhận kho</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                      {pendingCheckinCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('PENDING_RETURN');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'PENDING_RETURN'
                        ? 'bg-purple-50 text-purple-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Chờ trả kho</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">
                      {pendingReturnCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('PENDING_PAYMENT');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'PENDING_PAYMENT'
                        ? 'bg-amber-50 text-amber-800 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Giữ chỗ 48h</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                      {pendingReservations.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('CLOSED');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'CLOSED'
                        ? 'bg-slate-100 text-slate-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Đã kết thúc</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">
                      {closedCount}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Dropdown Lọc Theo Thời Hạn Thuê */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen);
                setIsStatusDropdownOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 h-9 bg-white border rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
                dateFilter !== 'ALL' || customFromDate || customToDate
                  ? 'border-brand-500 text-brand-700 bg-brand-50/40'
                  : 'border-slate-200/90 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {dateFilter === 'ALL'
                  ? 'Tất cả thời hạn'
                  : dateFilter === 'UPCOMING_30'
                  ? 'Sắp hết hạn (≤ 30 ngày)'
                  : dateFilter === 'THIS_MONTH'
                  ? 'Hết hạn tháng này'
                  : customFromDate || customToDate
                  ? `${customFromDate || '...'} → ${customToDate || '...'}`
                  : 'Khoảng ngày tùy chọn'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {isDateDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDateDropdownOpen(false)}
                />
                <div className="absolute left-0 sm:right-0 sm:left-auto top-10 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-2 space-y-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('ALL');
                      setCustomFromDate('');
                      setCustomToDate('');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      dateFilter === 'ALL' ? 'bg-brand-50 text-brand-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Tất cả thời hạn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('UPCOMING_30');
                      setCustomFromDate('');
                      setCustomToDate('');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      dateFilter === 'UPCOMING_30' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Sắp hết hạn (≤ 30 ngày)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDateFilter('THIS_MONTH');
                      setCustomFromDate('');
                      setCustomToDate('');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      dateFilter === 'THIS_MONTH' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Hết hạn tháng này</span>
                  </button>

                  <div className="pt-2 border-t border-slate-100">
                    <p className="px-1 text-[11px] font-bold text-slate-500 mb-1.5">Tùy chọn khoảng ngày:</p>
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Từ ngày</label>
                        <input
                          type="date"
                          value={customFromDate}
                          onChange={(e) => {
                            setCustomFromDate(e.target.value);
                            setDateFilter('CUSTOM');
                          }}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-0.5">Đến ngày</label>
                        <input
                          type="date"
                          value={customToDate}
                          onChange={(e) => {
                            setCustomToDate(e.target.value);
                            setDateFilter('CUSTOM');
                          }}
                          className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                    {(customFromDate || customToDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomFromDate('');
                          setCustomToDate('');
                          setDateFilter('ALL');
                        }}
                        className="mt-2 w-full text-center text-[11px] text-rose-600 hover:text-rose-700 font-medium py-1 cursor-pointer"
                      >
                        Xóa khoảng ngày
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Nút Làm Mới Dữ Liệu */}
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

          {/* Nút Thuê Thêm Ô Kho */}
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

      {/* BẢNG QUẢN LÝ HỢP ĐỒNG HỢP NHẤT (SAAS TABLE) */}
      {!isAuthenticated ? (
        <MyUnitsGuestPrompt />
      ) : (
        <MyUnitsTable
          contracts={filteredContracts}
          pendingReservations={filteredPendingReservations}
          loading={loading}
          searchQuery={searchQuery}
          statusFilter={activeTab}
          onClearFilters={() => {
            setSearchQuery('');
            setActiveTab('ALL');
            setDateFilter('ALL');
            setCustomFromDate('');
            setCustomToDate('');
          }}
          onViewDetail={(c) => setSelectedDetailContract(c)}
          onChangePin={(c) => setSelectedPinContract(c)}
          onScheduleReturn={(c) => setSelectedReturnContract(c)}
          onReschedulePeriod={(c) => setSelectedRescheduleContract(c)}
          onOpenOverduePayment={(c) => setSelectedOverdueContract(c)}
          onCancelReturn={(c) => {
            setCancelReturnError(null);
            setSelectedCancelReturnContract(c);
          }}
          onCancelPendingCheckIn={(c) => setSelectedCancelCheckInContract(c)}
          onCancelReservation={(r) => setCancellingReservation(r)}
          renewalNoticeDays={noticeDays > 0 ? noticeDays : undefined}
        />
      )}

      {/* CỤM 9 MODALS TƯƠNG TÁC */}
      <MyUnitsModals
        selectedPinContract={selectedPinContract}
        onClosePinModal={() => setSelectedPinContract(null)}
        onPinChanged={handlePinChanged}
        selectedReturnContract={selectedReturnContract}
        onCloseReturnModal={() => setSelectedReturnContract(null)}
        onReturnScheduled={handleReturnScheduled}
        selectedDetailContract={selectedDetailContract}
        onCloseDetailModal={() => setSelectedDetailContract(null)}
        onSelectReturnFromDetail={(c) => setSelectedReturnContract(c)}
        onSelectPinFromDetail={(c) => setSelectedPinContract(c)}
        onSelectRescheduleFromDetail={(c) => setSelectedRescheduleContract(c)}
        selectedRescheduleContract={selectedRescheduleContract}
        onCloseRescheduleModal={() => setSelectedRescheduleContract(null)}
        onRescheduleSuccess={() => {
          setSelectedRescheduleContract(null);
          loadContracts();
        }}
        selectedCancelCheckInContract={selectedCancelCheckInContract}
        onCloseCancelCheckInModal={() => setSelectedCancelCheckInContract(null)}
        onCancelCheckInSuccess={() => {
          setSelectedCancelCheckInContract(null);
          loadContracts();
          showToast('Đã hủy nhận kho thành công. Hệ thống đã tự động ghi nhận giao dịch hoàn tiền.');
        }}
        showEarlyRenewalModal={showEarlyRenewalModal}
        onCloseEarlyRenewalModal={handleCloseEarlyRenewalModal}
        earlyRenewalContract={earlyRenewalContract}
        noticeDays={noticeDays}
        reminderDays={reminderDays}
        selectedOverdueContract={selectedOverdueContract}
        onCloseOverdueModal={() => setSelectedOverdueContract(null)}
        onOverduePaymentSuccess={() => {
          setSelectedOverdueContract(null);
          loadContracts();
        }}
        cancellingReservation={cancellingReservation}
        onCloseCancelReservationModal={() => {
          if (!isCancelling) setCancellingReservation(null);
        }}
        onConfirmCancelReservation={handleConfirmCancelReservation}
        isCancelling={isCancelling}
        cancelError={cancelError}
        selectedCancelReturnContract={selectedCancelReturnContract}
        onCloseCancelReturnModal={() => {
          if (!isCancellingReturn) {
            setSelectedCancelReturnContract(null);
            setCancelReturnError(null);
          }
        }}
        onConfirmCancelReturn={handleConfirmCancelReturn}
        isCancellingReturn={isCancellingReturn}
        cancelReturnError={cancelReturnError}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/20'
                : 'bg-rose-900 text-white border-rose-700 shadow-rose-950/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <RotateCcw className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

    </div>
  );
};
