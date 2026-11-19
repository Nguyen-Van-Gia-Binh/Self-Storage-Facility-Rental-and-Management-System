import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Card } from '@/components/ui/Card';
import {
  Eye,
  EyeOff,
  QrCode,
  Clock,
  Layers,
  ArrowRight,
  X,
  CreditCard,
  FileText,
  MoreVertical,
  Calendar,
  RefreshCw,
  LogOut,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  KeyRound,
  Lock,
  Phone,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { formatDateVN, calculateEndDate, isCheckInAllowedToday } from '../utils/unitPickerHelpers';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
import type { RentedContract } from '../types';
import type { ReservationResponse } from '@/api/reservation';
import { DigitalMoveInPassModal } from './DigitalMoveInPassModal';
import { DirectContractPaymentModal } from './DirectContractPaymentModal';
import { tokenStorage } from '@/utils/tokenStorage';
import { useActivePolicy } from '@/hooks/useActivePolicy';

// 4 nhóm trạng thái phẳng chuẩn Enterprise SaaS: chấm tròn ngữ nghĩa + text trực tiếp (bỏ nền pill pastel)
type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

const STATUS_STYLE: Record<StatusTone, { text: string; dot: string }> = {
  success: { text: 'text-emerald-700', dot: 'bg-emerald-600' },
  warning: { text: 'text-amber-700', dot: 'bg-amber-500' },
  danger: { text: 'text-rose-700', dot: 'bg-rose-600' },
  neutral: { text: 'text-slate-500', dot: 'bg-slate-400' },
};

const StatusLabel: React.FC<{ tone: StatusTone; title?: string; children: React.ReactNode }> = ({
  tone,
  title,
  children,
}) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[tone].text}`}
    title={title}
  >
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_STYLE[tone].dot}`} aria-hidden="true" />
    <span>{children}</span>
  </span>
);

export interface ReservationCountdownBadgeProps {
  holdExpiresAt?: string;
  fallbackHoldHours?: number;
}

export const ReservationCountdownBadge: React.FC<ReservationCountdownBadgeProps> = ({
  holdExpiresAt,
  fallbackHoldHours = 15,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!holdExpiresAt) return fallbackHoldHours * 3600;
    const diff = Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const updateCountdown = () => {
      if (holdExpiresAt) {
        const diff = Math.floor((new Date(holdExpiresAt).getTime() - Date.now()) / 1000);
        setSecondsLeft(Math.max(0, diff));
      } else {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const isExpired = secondsLeft <= 0;

  const formattedCountdown = useMemo(() => {
    if (isExpired) return 'Hết hạn giữ chỗ';
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `Còn ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [secondsLeft, isExpired]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums whitespace-nowrap ${
        isExpired ? STATUS_STYLE.danger.text : STATUS_STYLE.warning.text
      }`}
      title={isExpired ? 'Đơn giữ chỗ đã hết hạn thanh toán' : `Thời gian giữ chỗ còn lại: ${formattedCountdown}`}
    >
      <Clock className={`w-3.5 h-3.5 shrink-0 ${isExpired ? 'text-rose-600' : 'text-amber-600'}`} />
      <span>{formattedCountdown}</span>
    </span>
  );
};

export interface MyUnitsTableProps {
  contracts: RentedContract[];
  pendingReservations: ReservationResponse[];
  loading: boolean;
  searchQuery: string;
  statusFilter: string;
  onClearFilters: () => void;
  onViewDetail: (contract: RentedContract) => void;
  onChangePin: (contract: RentedContract) => void;
  onScheduleReturn: (contract: RentedContract) => void;
  onReschedulePeriod: (contract: RentedContract) => void;
  onOpenOverduePayment: (contract: RentedContract) => void;
  onCancelReturn: (contract: RentedContract) => void;
  onCancelPendingCheckIn: (contract: RentedContract) => void;
  onCancelReservation: (reservation: ReservationResponse) => void;
  onCheckInSuccess?: (msg?: string) => void;
  renewalNoticeDays?: number;
  pageSize?: number;
  holdHours?: number;
}

export const MyUnitsTable: React.FC<MyUnitsTableProps> = ({
  contracts,
  pendingReservations,
  loading,
  searchQuery,
  statusFilter,
  onClearFilters,
  onViewDetail,
  onScheduleReturn,
  onReschedulePeriod,
  onOpenOverduePayment,
  onCancelReturn,
  onCancelPendingCheckIn,
  onCancelReservation,
  onCheckInSuccess,
  renewalNoticeDays,
  pageSize = 7,
  holdHours,
}) => {
  const policy = useActivePolicy();
  const effectiveHoldHours = holdHours || policy?.reservationHoldHours || 15;
  const [activePassContract, setActivePassContract] = useState<RentedContract | null>(null);
  const [activePassMode, setActivePassMode] = useState<'pass' | 'checkin'>('pass');
  const [payingContract, setPayingContract] = useState<RentedContract | null>(null);
  const [lateRenewalContract, setLateRenewalContract] = useState<RentedContract | null>(null);
  useScrollLock(Boolean(lateRenewalContract));
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  const handleCopyPin = (contractId: string, pin: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pin);
    setCopiedPinId(contractId);
    setTimeout(() => setCopiedPinId(null), 2000);
  };
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const togglePin = (contractId: string) => {
    setRevealedPins((prev) => ({ ...prev, [contractId]: !prev[contractId] }));
  };

  const totalItems = contracts.length + pendingReservations.length;

  // Reset trang về 1 khi số lượng bản ghi hoặc bộ lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [contracts.length, pendingReservations.length, searchQuery, statusFilter]);

  // Hợp nhất dữ liệu để phân trang nhất quán (Đơn giữ chỗ 48h trước, hợp đồng tiếp theo)
  type TableItem =
    | { kind: 'RESERVATION'; data: ReservationResponse }
    | { kind: 'CONTRACT'; data: RentedContract };

  const allItems: TableItem[] = useMemo(() => {
    return [
      ...pendingReservations.map((rsv) => ({ kind: 'RESERVATION' as const, data: rsv })),
      ...contracts.map((c) => ({ kind: 'CONTRACT' as const, data: c })),
    ];
  }, [pendingReservations, contracts]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, allItems.length);
  const paginatedItems = useMemo(() => {
    return allItems.slice(startIndex, startIndex + pageSize);
  }, [allItems, startIndex, pageSize]);

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 bg-white border border-slate-200/90 rounded-2xl">
        Đang tải dữ liệu danh sách ô kho...
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <Card className="p-10 text-center bg-white border border-slate-200/90 rounded-2xl space-y-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0a1614]">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Không tìm thấy ô kho nào phù hợp'
              : 'Bạn chưa có ô kho nào'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Không có kết quả nào khớp với bộ lọc đã chọn. Hãy thử tìm kiếm hoặc lọc lại.'
              : 'Bạn chưa có đơn đặt chỗ hoặc hợp đồng thuê kho nào trên hệ thống.'}
          </p>
        </div>
        {searchQuery || statusFilter !== 'ALL' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="mt-1 text-xs font-semibold cursor-pointer"
          >
            Xóa bộ lọc
          </Button>
        ) : (
          <Link to="/">
            <Button variant="primary" size="sm" className="mt-1 text-xs font-bold cursor-pointer">
              Khám phá và thuê ô kho mới
            </Button>
          </Link>
        )}
      </Card>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-2xs min-h-[280px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/85 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3 px-4 w-[15%]">Ô</th>
              <th className="py-3 px-4 w-[17%]">Cơ sở</th>
              <th className="py-3 px-4 w-[21%]">Thời hạn</th>
              <th className="py-3 px-4 w-[15%] text-center">Mã PIN / Mở kho</th>
              <th className="py-3 px-4 w-[16%] text-center">Trạng thái</th>
              <th className="py-3 px-4 w-[16%] text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedItems.map((item, idx) => {
              const isLastRows = paginatedItems.length >= 3 && idx >= paginatedItems.length - 2 && idx >= 2;

              if (item.kind === 'RESERVATION') {
                const rsv = item.data;
                const awaitingUnit = !rsv.storageUnitId || !rsv.storageUnitCode || rsv.storageUnitCode === 'Chua chon o';
                const bookingUrl = `/customer/booking?reservationId=${rsv.id}&facility=${rsv.facilityId}&type=${rsv.unitTypeId}${
                  awaitingUnit ? '' : `&unitId=${rsv.storageUnitId}&unitNumber=${encodeURIComponent(rsv.storageUnitCode || '')}`
                }&months=${rsv.rentalMonths}&startDate=${rsv.startDate}`;

                const isMenuOpen = openMenuId === `rsv-${rsv.id}`;

                return (
                <tr key={`rsv-${rsv.id}`} className="bg-white hover:bg-gray-50/80 transition-colors">
                  {/* Cột 1: Ô & Loại ô (Gộp 2 dòng) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm tracking-tight text-slate-900">
                        {awaitingUnit ? 'Chưa gán' : rsv.storageUnitCode}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {(rsv.unitTypeName || 'Tiêu chuẩn')
                          .replace(/^Kho\s+/i, '')
                          .replace(/\s*\([^)]*\)/g, '')
                          .trim()}
                      </span>
                    </div>
                  </td>

                  {/* Cột 2: Cơ sở (Bỏ chữ Cơ sở thừa) */}
                  <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {(rsv.facilityName || 'SmartStorage').replace(/^Cơ sở\s+/i, '')}
                  </td>

                  {/* Cột 4: Thời hạn */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                    {formatDateVN(rsv.startDate)} → {formatDateVN(rsv.endDateExclusive || calculateEndDate(rsv.startDate, rsv.rentalMonths))}
                  </td>

                  {/* Cột 5: Mã mở khóa */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="inline-flex items-center justify-center text-slate-300 text-xs">—</span>
                  </td>

                  {/* Cột 6: Trạng thái (Đồng hồ đếm lùi thời gian thực) */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                      <ReservationCountdownBadge holdExpiresAt={rsv.holdExpiresAt} fallbackHoldHours={effectiveHoldHours} />
                    </div>
                  </td>

                  {/* Cột 7: Thao tác */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      <Link to={bookingUrl} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 w-[124px] justify-center !rounded-md text-xs px-2.5 font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer whitespace-nowrap shadow-2xs"
                        >
                          <span>Thanh toán</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>

                      <div className="relative inline-flex items-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : `rsv-${rsv.id}`);
                          }}
                          className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                            isMenuOpen
                              ? 'bg-slate-100 border-slate-300 text-slate-800'
                              : 'border-slate-200/90 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                          title="Tùy chọn: Đổi PIN, Báo trả kho, Hỗ trợ..."
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                              }}
                            />
                            <div
                              className={`absolute right-0 ${
                                isLastRows ? 'bottom-full mb-1' : 'top-full mt-1'
                              } w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 text-xs`}
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                  onCancelReservation(rsv);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer font-medium"
                              >
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                <span>Hủy đơn giữ chỗ</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                );
              }

              const contract = item.data;
              const daysRemaining = calculateDaysRemaining(contract.endDate);
              const noticeThreshold =
                (renewalNoticeDays && renewalNoticeDays > 0 ? renewalNoticeDays : 30) + 7;
              const isExpiringSoon =
                contract.status === 'ACTIVE' && daysRemaining > 0 && daysRemaining <= noticeThreshold;
              const overdueDays =
                contract.overdueDays !== undefined && contract.overdueDays > 0
                  ? contract.overdueDays
                  : daysRemaining < 0
                  ? Math.abs(daysRemaining)
                  : contract.status === 'OVERDUE'
                  ? 1
                  : 0;
              const fallbackOverdueFee =
                contract.status === 'OVERDUE' && !contract.accessPin && (contract.overdueFee ?? 0) === 0
                  ? Math.min(
                      Math.round((contract.depositHeld || 0) * 0.55),
                      Math.round(
                        (contract.depositHeld || 0) *
                          (Math.min(overdueDays, 3) * 0.05 + Math.max(0, overdueDays - 3) * 0.1)
                      )
                    )
                  : 0;
              const penaltyFee = (contract.overdueFee ?? 0) > 0 ? contract.overdueFee! : fallbackOverdueFee;
              // Khóa nút gia hạn khi < 20 ngày theo quy chế BR-REN-01 (đối với ACTIVE, hợp đồng OVERDUE không thể tự gia hạn trực tuyến)
              const canRenewOnline = contract.status === 'ACTIVE' && daysRemaining >= 20;
              // Khách đã thanh toán hết phí quá hạn qua VNPay và được cấp Mã PIN tạm đến 23:59 để dọn đồ & Báo trả kho (BR-OVD-08)
              const isOverdueUnlocked = contract.status === 'OVERDUE' && penaltyFee === 0;
              const settlementDeficit =
                ((contract.status as string) === 'TERMINATED' || contract.status === 'PENDING_RETURN') &&
                (contract.totalOutstandingDebt ?? 0) > 0
                  ? contract.totalOutstandingDebt!
                  : 0;

              const isRevealed = Boolean(revealedPins[contract.id]);
              const isMenuOpen = openMenuId === `contract-${contract.id}`;

              const isPendingCheckIn =
                contract.status === 'PENDING_CHECKIN' ||
                (contract.status as string) === 'PENDING_CHECK_IN';

              const isClosed =
                contract.status === 'CLOSED' ||
                (contract.status as string) === 'TERMINATED' ||
                (contract.status as string) === 'CANCELLED';
              const isRelocating =
                Boolean(contract.relocationEligible) &&
                (isPendingCheckIn || contract.status === 'ACTIVE');

              const canOnlineCheckInPrimary =
                isPendingCheckIn &&
                !contract.hasPendingInitialPayment &&
                !isRelocating &&
                isStorageUnitAssigned(contract.unitNumber);

              const hasNonDetailPrimaryAction =
                Boolean(contract.hasPendingInitialPayment) ||
                (contract.status === 'OVERDUE' && penaltyFee > 0) ||
                settlementDeficit > 0 ||
                (canRenewOnline && isExpiringSoon) ||
                Boolean(contract.hasPendingRenewal) ||
                canOnlineCheckInPrimary;

              // Kiểm tra xem hàng có thao tác phụ hay không
              const hasSecondaryActions =
                isPendingCheckIn ||
                contract.status === 'ACTIVE' ||
                (contract.status === 'PENDING_RETURN' && !contract.inspectionDone) ||
                contract.status === 'OVERDUE' ||
                settlementDeficit > 0;

              return (
                <tr
                  key={contract.id}
                  className={`transition-all ${
                    isClosed
                      ? 'bg-gray-50 opacity-70 hover:opacity-100 hover:bg-gray-100/70'
                      : 'bg-white hover:bg-gray-50/80'
                  }`}
                >
                  {/* Cột 1: Ô & Loại ô (Gộp 2 dòng) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {contract.relocationEligible ? (
                        <button
                          type="button"
                          onClick={() => onViewDetail(contract)}
                          className="font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-xs self-start cursor-pointer transition-colors"
                          title="Xem chi tiết hợp đồng & Phụ lục đổi ô kho"
                        >
                          Chờ đổi ô
                        </button>
                      ) : !isStorageUnitAssigned(contract.unitNumber) ? (
                        <button
                          type="button"
                          onClick={() => onViewDetail(contract)}
                          className="font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-xs self-start cursor-pointer transition-colors"
                          title="Xem chi tiết hợp đồng"
                        >
                          Chưa gán ô
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onViewDetail(contract)}
                          className={`font-bold text-sm tracking-tight text-left transition-colors cursor-pointer ${
                            isClosed
                              ? 'text-gray-500 hover:text-gray-700'
                              : 'text-gray-900 hover:text-brand-700 hover:underline'
                          }`}
                          title="Xem chi tiết hợp đồng"
                        >
                          {contract.unitNumber}
                        </button>
                      )}
                      <span className="text-[11px] font-medium text-gray-500 inline-flex items-center gap-1 flex-wrap">
                        {(contract.unitTypeName || 'Tiêu chuẩn')
                          .replace(/^Kho\s+/i, '')
                          .replace(/\s*\([^)]*\)/g, '')
                          .trim()}
                        {contract.isUpgradedCompensation && (
                          <span
                            className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200"
                            title="Nâng hạng đền bù miễn phí (BR-BMP-01)"
                          >
                            Nâng hạng
                          </span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Cột 2: Cơ sở (Bỏ chữ Cơ sở thừa) */}
                  <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                    {contract.facilityName.replace(/^Cơ sở\s+/i, '')}
                  </td>

                  {/* Cột 3: Thời hạn thuê (tabular-nums rõ ràng, tương phản cao cho dòng cảnh báo) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-slate-900 tabular-nums">
                        {formatDateVN(contract.startDate)} → {formatDateVN(contract.endDate)}
                      </span>
                      {contract.status === 'ACTIVE' && isExpiringSoon && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-semibold text-amber-700 tabular-nums">
                            Còn {daysRemaining} ngày
                          </span>
                          {!canRenewOnline && !contract.hasPendingRenewal && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLateRenewalContract(contract);
                              }}
                              className="text-xs font-medium text-slate-500 hover:text-amber-700 underline underline-offset-2 cursor-pointer transition-colors"
                              title="Cổng tự gia hạn online đã đóng. Bấm để xem hướng dẫn liên hệ Quản lý cơ sở"
                            >
                              Khóa online (T-20)
                            </button>
                          )}
                        </div>
                      )}
                      {contract.status === 'OVERDUE' && (
                        <span className="text-xs font-semibold text-rose-700 mt-1 tabular-nums">
                          Quá hạn D+{overdueDays}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cột 4: Mã mở khóa */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                    {contract.status === 'OVERDUE' && !isOverdueUnlocked ? (
                      <span
                        className="inline-flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium"
                        title="Mã PIN đang bị khóa do quá hạn. Vui lòng thanh toán để mở lại PIN tạm thời."
                      >
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Đã khóa PIN</span>
                      </span>
                    ) : contract.accessPin && !isPendingCheckIn ? (
                      <div className="inline-flex items-center justify-between min-w-[116px] h-7 gap-1 px-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
                        <div className="inline-flex items-center gap-1">
                          <span className="text-slate-400 text-[10px] font-medium">PIN:</span>
                          <span className="font-semibold text-slate-800 tracking-wider tabular-nums">
                            {isRevealed ? contract.accessPin : '••••••'}
                          </span>
                        </div>
                        <div className="inline-flex items-center">
                          <button
                            type="button"
                            onClick={() => togglePin(contract.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition-colors"
                            title={isRevealed ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {isRevealed && (
                            <button
                              type="button"
                              onClick={(e) => handleCopyPin(contract.id, contract.accessPin!, e)}
                              className="text-slate-400 hover:text-brand-600 p-0.5 cursor-pointer transition-colors"
                              title="Sao chép mã PIN"
                            >
                              {copiedPinId === contract.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isRelocating ? (
                      <span className="text-amber-700 text-xs font-medium">Đang đổi ô kho</span>
                    ) : contract.hasPendingInitialPayment ? (
                      <span className="text-amber-700 text-xs font-medium">Chờ thanh toán</span>
                    ) : isPendingCheckIn ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePassMode('pass');
                          setActivePassContract(contract);
                        }}
                        className="h-7 rounded-md text-xs px-2.5 font-medium text-slate-700 border-slate-300 bg-white hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                        title="Xem mã QR và thông tin vé nhận kho"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Vé nhận kho
                      </Button>
                    ) : contract.status === 'OVERDUE' ? (
                      <span
                        className="inline-flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium"
                        title="Mã PIN đang bị khóa do quá hạn. Vui lòng thanh toán để mở lại PIN tạm thời."
                      >
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Đã khóa PIN</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center text-slate-300 text-xs">—</span>
                    )}
                    </div>
                  </td>

                  {/* Cột 5: Trạng thái phẳng (Chấm tròn + Text màu ngữ nghĩa, không nền pill) */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-center">
                    <div className="flex justify-center">
                    {contract.hasPendingRenewal ? (
                      <StatusLabel tone="warning" title="Đang có đơn gia hạn chờ thanh toán VNPay">
                        Chờ thanh toán gia hạn
                      </StatusLabel>
                    ) : contract.status === 'ACTIVE' && isExpiringSoon ? (
                      <StatusLabel tone="warning" title={`Sắp hết hạn (Còn ${daysRemaining} ngày)`}>
                        Sắp hết hạn
                      </StatusLabel>
                    ) : contract.status === 'ACTIVE' ? (
                      <StatusLabel tone="success">Đang hoạt động</StatusLabel>
                    ) : contract.status === 'OVERDUE' ? (
                      <StatusLabel
                        tone="danger"
                        title={
                          isOverdueUnlocked
                            ? `Đã mở PIN tạm trong ngày (D+${overdueDays}) — Vui lòng mở menu ••• chọn Báo trả kho sau khi dọn đồ`
                            : overdueDays <= 3
                            ? `Quá hạn D+${overdueDays} (5%/ngày)`
                            : `Quá hạn D+${overdueDays} (Phạt 10%/ngày)`
                        }
                      >
                        {isOverdueUnlocked ? 'Quá hạn · Mở PIN' : `Quá hạn (D+${overdueDays})`}
                      </StatusLabel>
                    ) : (contract.relocationEligible || isRelocating) ? (
                      <StatusLabel tone="warning" title="Từ chối ô cũ do lỗi hiện trường - Đang chờ bố trí ô kho thay thế">
                        Đổi ô kho
                      </StatusLabel>
                    ) : contract.hasPendingInitialPayment ? (
                      <StatusLabel tone="warning" title="Chờ thanh toán tiền cọc & tiền thuê ban đầu">
                        Chờ thanh toán
                      </StatusLabel>
                    ) : isPendingCheckIn ? (
                      <StatusLabel tone="warning">Chờ nhận kho</StatusLabel>
                    ) : contract.status === 'PENDING_RETURN' ? (
                      <StatusLabel tone={contract.inspectionDone ? 'success' : 'warning'}>
                        {contract.inspectionDone ? 'Đã nghiệm thu' : 'Chờ nghiệm thu'}
                      </StatusLabel>
                    ) : (contract.status as string) === 'CANCELLED' ? (
                      <StatusLabel tone="neutral" title="Đã hủy nhận kho - Đang chờ Quản lý cơ sở duyệt quyết toán hoàn tiền">
                        Đã hủy · Chờ hoàn
                      </StatusLabel>
                    ) : (contract.status as string) === 'TERMINATED' ? (
                      contract.isDoubleDepositCompensation ? (
                        <StatusLabel tone="danger" title="Cháy kho 100% · Bồi thường phạt cọc gấp đôi theo Điều 328 BLDS (BR-BMP-02)">
                          Đền bù cọc 2x (BR-BMP-02)
                        </StatusLabel>
                      ) : (contract.depositHeld === 0 || (contract.overdueDays ?? 0) >= 7) ? (
                        <StatusLabel tone="danger">Bị niêm phong</StatusLabel>
                      ) : (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND')) ? (
                        <StatusLabel tone="danger" title={contract.rejectionReason || 'Từ chối nhận bàn giao tại hiện trường'}>
                          Từ chối nhận kho
                        </StatusLabel>
                      ) : (
                        <StatusLabel tone="neutral" title="Đã hủy trước ngày nhận kho - Ô vật lý đã được giải phóng">
                          Đã hủy
                        </StatusLabel>
                      )
                    ) : contract.status === 'CLOSED' ? (
                      <StatusLabel tone="neutral">Đã kết thúc</StatusLabel>
                    ) : (
                      <StatusLabel tone="neutral">{contract.status}</StatusLabel>
                    )}
                    </div>
                  </td>

                  {/* Cột 6: Thao tác (1 Primary Action đồng nhất thương hiệu + Text link Chi tiết / Menu •••) */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                      {/* 1. Nút hành động chính */}
                      {contract.hasPendingInitialPayment ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPayingContract(contract);
                          }}
                          className="h-7 w-[124px] justify-center !rounded-md text-xs px-2.5 font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                          title="Thanh toán trực tuyến VNPay tiền cọc & thuê ban đầu"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Thanh toán
                        </Button>
                      ) : contract.status === 'OVERDUE' && penaltyFee > 0 ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOverduePayment({ ...contract, overdueFee: penaltyFee });
                          }}
                          className="h-7 w-[124px] justify-center !rounded-md text-xs px-2.5 font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                          title="Thanh toán phí quá hạn qua VNPay để mở Mã PIN tạm thời (đến 23:59)"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Thanh toán ngay
                        </Button>
                      ) : settlementDeficit > 0 ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOverduePayment(contract);
                          }}
                          className="h-7 w-[124px] justify-center !rounded-md text-xs px-2.5 font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                          title="Thanh toán chi phí phát sinh / lưu Kho Tổng để nhận lại tài sản và đóng hợp đồng"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Thanh toán ngay
                        </Button>
                      ) : (canRenewOnline && isExpiringSoon) || contract.hasPendingRenewal ? (
                        <Link
                          to={
                            contract.hasPendingRenewal && contract.pendingRenewalOrderCode
                              ? `/customer/renew/${contract.id}?orderCode=${contract.pendingRenewalOrderCode}&step=3`
                              : `/customer/renew/${contract.id}`
                          }
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-7 w-[124px] px-2.5 justify-center !rounded-md text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            {contract.hasPendingRenewal ? 'Thanh toán' : 'Gia hạn'}
                          </Button>
                        </Link>
                      ) : canOnlineCheckInPrimary ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={!isCheckInAllowedToday(contract.startDate)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isCheckInAllowedToday(contract.startDate)) return;
                            setActivePassMode('checkin');
                            setActivePassContract(contract);
                          }}
                          className={`h-7 w-[124px] justify-center !rounded-md text-xs px-2.5 font-semibold whitespace-nowrap shrink-0 shadow-2xs ${
                            isCheckInAllowedToday(contract.startDate)
                              ? 'bg-brand-600 hover:bg-brand-700 text-white cursor-pointer'
                              : 'bg-slate-100 hover:bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          }`}
                          title={
                            isCheckInAllowedToday(contract.startDate)
                              ? 'Tự làm thủ tục ký số nhận bàn giao & kích hoạt mã PIN mở kho 24/7'
                              : `Chưa đến ngày nhận kho (${formatDateVN(contract.startDate)}). Chỉ được check-in vào đúng ngày trên hợp đồng.`
                          }
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1" />
                          Check-in online
                        </Button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(contract);
                          }}
                          className="inline-flex h-7 w-[124px] items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-700 hover:underline underline-offset-2 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          title="Xem chi tiết hợp đồng"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Chi tiết</span>
                        </button>
                      )}

                      {/* 2. Menu 3 chấm (Thao tác phụ) — Luôn giữ slot w-7 h-7 để nút chính thẳng hàng */}
                      {hasSecondaryActions ? (
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : `contract-${contract.id}`);
                            }}
                            className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                              isMenuOpen
                                ? 'bg-gray-100 border-gray-300 text-gray-800'
                                : 'border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                            title="Thao tác khác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(null);
                                }}
                              />
                              <div
                                className={`absolute right-0 ${
                                  isLastRows ? 'bottom-full mb-1' : 'top-full mt-1'
                                } w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-40 py-1 text-xs divide-y divide-gray-100 text-left`}
                              >
                                {/* Xem chi tiết nếu nút chính không phải Chi tiết */}
                                {hasNonDetailPrimaryAction && (
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onViewDetail(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Xem chi tiết hợp đồng</span>
                                    </button>
                                  </div>
                                )}

                                {/* Báo trả kho cho hợp đồng Quá hạn đã mở PIN tạm */}
                                {isOverdueUnlocked && (
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onScheduleReturn(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <LogOut className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Báo trả kho</span>
                                    </button>
                                  </div>
                                )}

                                {/* Menu cho PENDING_CHECKIN */}
                                {isPendingCheckIn && (
                                  <div className="py-0.5">
                                    {contract.hasPendingInitialPayment && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuId(null);
                                          setPayingContract(contract);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-emerald-50 text-brand-700 transition-colors cursor-pointer font-semibold"
                                      >
                                        <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                                        <span>Thanh toán ngay</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={(contract.rescheduleCount ?? 0) >= 1}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if ((contract.rescheduleCount ?? 0) < 1) {
                                          setOpenMenuId(null);
                                          onReschedulePeriod(contract);
                                        }
                                      }}
                                      title={
                                        (contract.rescheduleCount ?? 0) >= 1
                                          ? 'Mỗi hợp đồng chỉ được phép dời lịch nhận kho tối đa 1 lần duy nhất'
                                          : 'Dời ngày nhận kho'
                                      }
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors font-medium ${
                                        (contract.rescheduleCount ?? 0) >= 1
                                          ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50'
                                          : 'hover:bg-gray-50 text-gray-700 cursor-pointer'
                                      }`}
                                    >
                                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                      <span>
                                        {(contract.rescheduleCount ?? 0) >= 1
                                          ? 'Đã dời lịch (1/1)'
                                          : 'Dời ngày nhận kho'}
                                      </span>
                                    </button>
                                    {(!contract.startDate ||
                                      new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }) <=
                                        contract.startDate.slice(0, 10)) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuId(null);
                                          onCancelPendingCheckIn(contract);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer font-medium"
                                      >
                                        <X className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Hủy nhận kho</span>
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Menu cho ACTIVE */}
                                {contract.status === 'ACTIVE' && (
                                  <div className="py-0.5">
                                    {canRenewOnline && !isExpiringSoon && !contract.hasPendingRenewal && (
                                      <Link
                                        to={`/customer/renew/${contract.id}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer font-medium"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                                        <span>Gia hạn hợp đồng</span>
                                      </Link>
                                    )}
                                    {!canRenewOnline && !contract.hasPendingRenewal && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuId(null);
                                          setLateRenewalContract(contract);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-amber-50 text-amber-700 transition-colors cursor-pointer font-medium"
                                      >
                                        <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Xin gia hạn muộn (T-20)</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onScheduleReturn(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <LogOut className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Báo trả kho</span>
                                    </button>
                                  </div>
                                )}

                                {/* Menu cho PENDING_RETURN */}
                                {contract.status === 'PENDING_RETURN' && !contract.inspectionDone && (
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onCancelReturn(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-amber-50 text-amber-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Hủy yêu cầu trả kho</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="h-7 w-7 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-1 text-xs text-slate-500">
            <div>
              Hiển thị <span className="font-semibold text-slate-800">{startIndex + 1}</span> -{' '}
              <span className="font-semibold text-slate-800">{endIndex}</span> trên tổng số{' '}
              <span className="font-semibold text-slate-800">{allItems.length}</span> ô kho
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md text-xs font-bold tabular-nums transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer shadow-2xs"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      {/* Digital Move In Pass Modal */}
      {activePassContract && (
        <DigitalMoveInPassModal
          isOpen={Boolean(activePassContract)}
          onClose={() => setActivePassContract(null)}
          initialMode={activePassMode}
          contractId={activePassContract.id}
          onSuccessCheckIn={(pin) => {
            activePassContract.status = 'ACTIVE';
            if (pin) activePassContract.accessPin = pin;
            setActivePassContract(null);
            onCheckInSuccess?.('Check-in online thành công! Hợp đồng của quý khách đã có hiệu lực.');
          }}
          onConfirmSignature={() => {
            activePassContract.status = 'ACTIVE';
          }}
          onRejectHandover={(action, reason) => {
            if (action === 'RELOCATE') {
              activePassContract.relocationEligible = true;
              activePassContract.unitNumber = 'Chờ đổi ô';
              onCheckInSuccess?.('Đã gửi yêu cầu đổi ô kho. Cơ sở đang xử lý phân bổ ô kho mới cho quý khách.');
            } else {
              (activePassContract.status as any) = 'TERMINATED';
              activePassContract.handoverRejected = true;
              activePassContract.rejectionReason = reason;
              activePassContract.unitNumber = '-';
              onCheckInSuccess?.('Đã ghi nhận từ chối nhận kho và yêu cầu hủy hợp đồng, hoàn tiền 100%.');
            }
            setActivePassContract(null);
          }}
          passData={{
            passCode: `PASS-${activePassContract.contractNumber}`,
            reservationId: activePassContract.contractNumber,
            unitNumber: activePassContract.unitNumber,
            facilityId: activePassContract.facilityId || '',
            facilityName: activePassContract.facilityName,
            facilityAddress: (activePassContract as any).facilityAddress || activePassContract.facilityName,
            facilityPhone: '1900 8888',
            customerName: tokenStorage.getUser()?.fullName || 'Khách hàng',
            customerPhone: (tokenStorage.getUser() as any)?.phone || '',
            customerIdentity: '',
            startDate: activePassContract.startDate,
            checkInWindow: '08:00 - 20:00 (Giờ làm việc quầy lễ tân)',
            status: 'PENDING_CHECKIN',
            totalPaid: (activePassContract.monthlyRent || 0) + (activePassContract.depositHeld || 0),
          }}
        />
      )}

      {/* Direct Contract Payment Modal */}
      {payingContract && (
        <DirectContractPaymentModal
          isOpen={Boolean(payingContract)}
          onClose={() => setPayingContract(null)}
          onPaymentSuccess={() => {
            setPayingContract(null);
            onCheckInSuccess?.();
          }}
          contract={payingContract}
        />
      )}

      {/* Modal Hướng dẫn Chính sách Gia hạn muộn (T-20) — Render qua Portal để phủ 100% viewport & khóa cuộn */}
      {lateRenewalContract &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setLateRenewalContract(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header trắng gọn, đóng qua nút X */}
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-start gap-4 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chính sách Gia hạn muộn (T-20)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ô kho: <span className="font-semibold text-slate-800">{lateRenewalContract.unitNumber}</span> • {lateRenewalContract.facilityName}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setLateRenewalContract(null)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Khối cảnh báo chính sách */}
              <div className="px-6 pt-5 pb-2">
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    <p className="font-semibold mb-0.5">Chính sách quan trọng</p>
                    <p className="text-amber-800">
                      Hợp đồng còn dưới 20 ngày. Hệ thống đã khóa tự gia hạn trực tuyến để ưu tiên danh sách khách hàng đang chờ thuê.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hai lựa chọn hành động phẳng, ngăn cách bằng đường kẻ mảnh (không bọc Card) */}
              <div className="px-6 py-3 divide-y divide-slate-200">
                {/* Lựa chọn 1: Gia hạn hợp đồng (Nút viền vì là thao tác gọi điện ngoài hệ thống) */}
                <div className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">Gia hạn hợp đồng</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Vui lòng liên hệ hotline <span className="font-semibold text-slate-800 tabular-nums">1900 8888</span> để được duyệt gia hạn ngoại lệ. Phí phát sinh:{' '}
                      <strong className="font-semibold text-slate-900 tabular-nums">200.000 đ</strong>.
                    </p>
                  </div>
                  <a
                    href="tel:19008888"
                    className="w-full sm:w-[136px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gọi 1900 8888</span>
                  </a>
                </div>

                {/* Lựa chọn 2: Trả kho & Thanh lý (Nút Primary đặc vì hệ thống xử lý trực tiếp) */}
                <div className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">Trả kho &amp; Thanh lý</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Đặt lịch dọn đồ và nghiệm thu trước ngày hết hạn, không phát sinh phí phạt.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const c = lateRenewalContract;
                      setLateRenewalContract(null);
                      onScheduleReturn(c);
                    }}
                    className="w-full sm:w-[136px] px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-md text-center transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Báo trả kho
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
