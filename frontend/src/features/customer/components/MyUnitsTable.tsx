import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
} from 'lucide-react';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { formatDateVN, calculateEndDate, isCheckInAllowedToday } from '../utils/unitPickerHelpers';
import { isStorageUnitAssigned } from '../utils/unitAssignment';
import type { RentedContract } from '../types';
import type { ReservationResponse } from '@/api/reservation';
import { DigitalMoveInPassModal } from './DigitalMoveInPassModal';
import { tokenStorage } from '@/utils/tokenStorage';

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
  onCheckInSuccess?: () => void;
  renewalNoticeDays?: number;
  pageSize?: number;
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
}) => {
  const [activePassContract, setActivePassContract] = useState<RentedContract | null>(null);
  const [activePassMode, setActivePassMode] = useState<'pass' | 'checkin'>('pass');
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
          <Link to="/customer">
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
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/85 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
            <tr>
              <th className="py-3 px-4">Ô</th>
              <th className="py-3 px-4">Cơ sở</th>
              <th className="py-3 px-4">Thời hạn</th>
              <th className="py-3 px-4">Mã PIN / Mở kho</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedItems.map((item, idx) => {
              const isLastRows = idx >= paginatedItems.length - 2;

              if (item.kind === 'RESERVATION') {
                const rsv = item.data;
                const awaitingUnit = !rsv.storageUnitId || !rsv.storageUnitCode || rsv.storageUnitCode === 'Chua chon o';
                const bookingUrl = `/customer/booking?reservationId=${rsv.id}&facility=${rsv.facilityId}&type=${rsv.unitTypeId}${
                  awaitingUnit ? '' : `&unitId=${rsv.storageUnitId}&unitNumber=${encodeURIComponent(rsv.storageUnitCode || '')}`
                }&months=${rsv.rentalMonths}&startDate=${rsv.startDate}`;

                const isMenuOpen = openMenuId === `rsv-${rsv.id}`;

                return (
                <tr key={`rsv-${rsv.id}`} className="hover:bg-rose-50/30 transition-colors">
                  {/* Cột 1: Ô & Loại ô (Gộp 2 dòng) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-sm tracking-tight font-mono text-slate-900">
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
                  <td className="py-3.5 px-4 text-slate-300 text-xs whitespace-nowrap">
                    —
                  </td>

                  {/* Cột 6: Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      <Clock className="w-3 h-3 text-rose-600 animate-pulse" />
                      <span>Giữ chỗ 48h</span>
                    </span>
                  </td>

                  {/* Cột 7: Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <Link to={bookingUrl} className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-bold cursor-pointer whitespace-nowrap shadow-xs"
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
              const isUrgentExpiring = isExpiringSoon && daysRemaining <= 7;
              const overdueDays =
                contract.overdueDays !== undefined && contract.overdueDays > 0
                  ? contract.overdueDays
                  : daysRemaining < 0
                  ? Math.abs(daysRemaining)
                  : contract.status === 'OVERDUE'
                  ? 1
                  : 0;
              const penaltyFee = contract.overdueFee ?? 0;
              const isGracePeriod =
                contract.status === 'OVERDUE' && penaltyFee === 0 && overdueDays <= 3;
              // Khóa nút gia hạn khi < 20 ngày theo quy chế BR-REN-01 (đối với ACTIVE)
              const canRenewOnline =
                (contract.status === 'ACTIVE' && daysRemaining >= 20) ||
                (contract.status === 'OVERDUE' && penaltyFee === 0);

              const isRevealed = Boolean(revealedPins[contract.id]);
              const isMenuOpen = openMenuId === `contract-${contract.id}`;

              // Kiểm tra xem hàng có thao tác phụ hay không
              const hasSecondaryActions =
                contract.status === 'PENDING_CHECKIN' ||
                (contract.status as string) === 'PENDING_CHECK_IN' ||
                contract.status === 'ACTIVE' ||
                (contract.status === 'PENDING_RETURN' && !contract.inspectionDone) ||
                contract.status === 'OVERDUE';

              const isClosed = contract.status === 'CLOSED' || (contract.status as string) === 'TERMINATED';
              const isRelocating =
                Boolean(contract.relocationEligible) &&
                (contract.status === 'PENDING_CHECKIN' ||
                  (contract.status as string) === 'PENDING_CHECK_IN' ||
                  contract.status === 'ACTIVE');

              return (
                <tr
                  key={contract.id}
                  className={`transition-colors ${
                    isClosed
                      ? 'bg-slate-50/40 opacity-60 text-slate-400'
                      : contract.status === 'OVERDUE'
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : isUrgentExpiring
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Cột 1: Ô & Loại ô (Gộp 2 dòng) */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {contract.relocationEligible ? (
                        <button
                          type="button"
                          onClick={() => onViewDetail(contract)}
                          className="font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-xs font-mono self-start cursor-pointer transition-colors"
                          title="Xem chi tiết hợp đồng & Phụ lục đổi ô kho"
                        >
                          Chờ đổi ô
                        </button>
                      ) : !isStorageUnitAssigned(contract.unitNumber) ? (
                        <button
                          type="button"
                          onClick={() => onViewDetail(contract)}
                          className="font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-xs font-mono self-start cursor-pointer transition-colors"
                          title="Xem chi tiết hợp đồng"
                        >
                          Chưa gán ô
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onViewDetail(contract)}
                          className={`font-extrabold text-sm tracking-tight font-mono text-left transition-colors cursor-pointer ${
                            isClosed ? "text-slate-400 hover:text-slate-600" : "text-slate-900 hover:text-brand-700 hover:underline"
                          }`}
                          title="Xem chi tiết hợp đồng"
                        >
                          {contract.unitNumber}
                        </button>
                      )}
                      <span className="text-[11px] font-medium text-slate-500">
                        {(contract.unitTypeName || 'Tiêu chuẩn')
                          .replace(/^Kho\s+/i, '')
                          .replace(/\s*\([^)]*\)/g, '')
                          .trim()}
                      </span>
                    </div>
                  </td>

                  {/* Cột 2: Cơ sở (Bỏ chữ Cơ sở thừa) */}
                  <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {contract.facilityName.replace(/^Cơ sở\s+/i, '')}
                  </td>

                  {/* Cột 4: Thời hạn thuê */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                    {formatDateVN(contract.startDate)} → {formatDateVN(contract.endDate)}
                  </td>

                  {/* Cột 5: Mã mở khóa */}
                  <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {contract.accessPin && contract.status !== 'PENDING_CHECKIN' && (contract.status as string) !== 'PENDING_CHECK_IN' ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
                        <span className="text-slate-400 text-[10px] font-medium mr-0.5">PIN:</span>
                        <span className="font-mono font-black text-slate-800 tracking-wider">
                          {isRevealed ? contract.accessPin : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePin(contract.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition-colors ml-0.5"
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
                    ) : isRelocating ? (
                      <span className="text-amber-700 text-xs font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                        Đang đổi ô kho
                      </span>
                    ) : contract.status === 'PENDING_CHECKIN' ||
                      (contract.status as string) === 'PENDING_CHECK_IN' ? (
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePassMode('pass');
                            setActivePassContract(contract);
                          }}
                          className="h-7 text-[11px] px-2.5 font-bold text-slate-700 border-slate-200/90 bg-white hover:bg-slate-50 whitespace-nowrap shrink-0 shadow-2xs cursor-pointer"
                          title="Xem mã QR và thông tin vé nhận kho"
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1 text-slate-500" />
                          Vé nhận kho
                        </Button>
                        {isStorageUnitAssigned(contract.unitNumber) && (
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
                            className={`h-7 text-[11px] px-2.5 font-bold whitespace-nowrap shrink-0 shadow-2xs ${
                              isCheckInAllowedToday(contract.startDate)
                                ? 'bg-[#0d6050] hover:bg-[#12836d] text-white cursor-pointer'
                                : 'bg-slate-100 hover:bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                            }`}
                            title={
                              isCheckInAllowedToday(contract.startDate)
                                ? 'Tự làm thủ tục ký số nhận bàn giao & kích hoạt mã PIN mở kho 24/7'
                                : `Chưa đến ngày nhận kho (${formatDateVN(contract.startDate)}). Chỉ được check-in vào đúng ngày trên hợp đồng.`
                            }
                          >
                            <KeyRound className={`w-3.5 h-3.5 mr-1 ${isCheckInAllowedToday(contract.startDate) ? 'text-amber-300' : 'text-slate-400'}`} />
                            Check-in online
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Cột 6: Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {contract.status === 'ACTIVE' && isExpiringSoon ? (
                      <Badge
                        variant={isUrgentExpiring ? 'overdue' : 'warning'}
                        className={isUrgentExpiring ? 'bg-red-50 text-red-700 border-red-300' : ''}
                      >
                        Sắp hết hạn ({daysRemaining} ngày)
                      </Badge>
                    ) : contract.status === 'ACTIVE' ? (
                      <Badge variant="available">Đang hoạt động</Badge>
                    ) : contract.status === 'OVERDUE' ? (
                      <Badge variant={isGracePeriod ? 'warning' : 'overdue'}>
                        {isGracePeriod ? `Ân hạn D+${overdueDays}` : `Quá hạn D+${overdueDays}`}
                      </Badge>
                    ) : (contract.relocationEligible || isRelocating) ? (
                      <Badge variant="warning" className="bg-amber-100 text-amber-900 border-amber-300 font-bold" title="Từ chối ô cũ do lỗi hiện trường - Đang chờ bố trí ô kho thay thế">
                        Đổi ô kho
                      </Badge>
                    ) : contract.status === 'PENDING_CHECKIN' ||
                      (contract.status as string) === 'PENDING_CHECK_IN' ? (
                      <Badge variant="reserved">Chờ nhận kho</Badge>
                    ) : contract.status === 'PENDING_RETURN' ? (
                      <Badge variant={contract.inspectionDone ? 'info' : 'warning'}>
                        {contract.inspectionDone ? 'Đã nghiệm thu' : 'Chờ nghiệm thu'}
                      </Badge>
                    ) : (contract.status as string) === 'TERMINATED' ? (
                      (contract.handoverRejected || contract.contractNumber?.includes('REJ') || contract.contractNumber?.includes('REFUND')) ? (
                        <Badge variant="danger" className="bg-rose-100 text-rose-800 border-rose-300 font-bold" title={contract.rejectionReason || 'Từ chối nhận bàn giao tại hiện trường'}>
                          Từ chối nhận kho
                        </Badge>
                      ) : (!isStorageUnitAssigned(contract.unitNumber) || contract.unitNumber === 'Chưa gán ô' || contract.unitNumber === 'Chưa gán ô kho' || contract.contractNumber?.includes('NO-UNIT')) ? (
                        <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200" title="Đã hủy khi chưa phân bổ ô vật lý - Hoàn cọc 100%">
                          Đã hủy
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="bg-rose-50 text-rose-700 border-rose-200" title="Đã hủy trước ngày nhận kho - Ô vật lý đã được giải phóng">
                          Đã hủy
                        </Badge>
                      )
                    ) : contract.status === 'CLOSED' ? (
                      <Badge variant="default">Đã kết thúc</Badge>
                    ) : (
                      <Badge variant="default">{contract.status}</Badge>
                    )}
                  </td>

                  {/* Cột 7: Thao tác (Gọn gàng: Nút chính + menu •••) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {/* 1. Nút hành động chính */}
                      {contract.status === 'OVERDUE' && penaltyFee > 0 ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenOverduePayment(contract);
                          }}
                          className="h-7 text-xs px-2.5 font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Nộp phạt
                        </Button>
                      ) : canRenewOnline && isExpiringSoon ? (
                        <Link
                          to={`/customer/renew/${contract.id}`}
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="primary"
                            size="sm"
                            className={`h-7 text-xs px-2.5 font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-xs ${
                              isUrgentExpiring
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                            }`}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Gia hạn
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetail(contract);
                          }}
                          className="h-7 text-xs px-2.5 font-semibold text-slate-700 border-slate-200/90 hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
                          title="Xem chi tiết hợp đồng"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          Chi tiết
                        </Button>
                      )}

                      {/* 2. Menu 3 chấm (Thao tác phụ) */}
                      {hasSecondaryActions && (
                        <div className="relative inline-flex items-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : `contract-${contract.id}`);
                            }}
                            className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 ${
                              isMenuOpen
                                ? 'bg-slate-100 border-slate-300 text-slate-800'
                                : 'border-slate-200/90 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                            }`}
                            title="Thao tác khác"
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
                                } w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 text-xs divide-y divide-slate-100 text-left`}
                              >
                                {/* Xem chi tiết nếu nút chính đang là Gia hạn hoặc Nộp phạt */}
                                {(isExpiringSoon || (contract.status === 'OVERDUE' && penaltyFee > 0)) && (
                                  <div className="py-0.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onViewDetail(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Xem chi tiết hợp đồng</span>
                                    </button>
                                  </div>
                                )}

                                {/* Menu cho PENDING_CHECKIN */}
                                {(contract.status === 'PENDING_CHECKIN' ||
                                  (contract.status as string) === 'PENDING_CHECK_IN') && (
                                  <div className="py-0.5">
                                    {isStorageUnitAssigned(contract.unitNumber) && (
                                      <button
                                        type="button"
                                        disabled={!isCheckInAllowedToday(contract.startDate)}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isCheckInAllowedToday(contract.startDate)) return;
                                          setOpenMenuId(null);
                                          setActivePassMode('checkin');
                                          setActivePassContract(contract);
                                        }}
                                        title={
                                          isCheckInAllowedToday(contract.startDate)
                                            ? 'Tự làm thủ tục ký số nhận bàn giao & kích hoạt mã PIN mở kho 24/7'
                                            : `Chưa đến ngày nhận kho (${formatDateVN(contract.startDate)}). Chỉ được check-in vào đúng ngày trên hợp đồng.`
                                        }
                                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors font-bold ${
                                          isCheckInAllowedToday(contract.startDate)
                                            ? 'hover:bg-emerald-50 text-[#0d6050] cursor-pointer'
                                            : 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50'
                                        }`}
                                      >
                                        <KeyRound className={`w-3.5 h-3.5 ${isCheckInAllowedToday(contract.startDate) ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <span>Check-in online (24/7)</span>
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
                                          ? 'Mỗi hợp đồng chỉ được phép dời lịch nhận kho tối đa 1 lần duy nhất (BR-RES-06)'
                                          : 'Dời ngày nhận kho'
                                      }
                                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors font-medium ${
                                        (contract.rescheduleCount ?? 0) >= 1
                                          ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50'
                                          : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                                      }`}
                                    >
                                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                      <span>
                                        {(contract.rescheduleCount ?? 0) >= 1
                                          ? 'Đã dời lịch (1/1)'
                                          : 'Dời ngày nhận kho'}
                                      </span>
                                    </button>
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
                                  </div>
                                )}

                                {/* Menu cho ACTIVE */}
                                {contract.status === 'ACTIVE' && (
                                  <div className="py-0.5">
                                    {canRenewOnline && !isExpiringSoon && (
                                      <Link
                                        to={`/customer/renew/${contract.id}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer font-medium"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Gia hạn hợp đồng</span>
                                      </Link>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuId(null);
                                        onScheduleReturn(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <LogOut className="w-3.5 h-3.5 text-slate-500" />
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-brand-600 text-white shadow-xs'
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold cursor-pointer shadow-2xs"
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
          onSuccessCheckIn={() => {
            activePassContract.status = 'ACTIVE';
            onCheckInSuccess?.();
          }}
          onConfirmSignature={() => {
            activePassContract.status = 'ACTIVE';
          }}
          onRejectHandover={(action, reason) => {
            if (action === 'RELOCATE') {
              activePassContract.relocationEligible = true;
              activePassContract.unitNumber = 'Chờ đổi ô';
            } else {
              (activePassContract.status as any) = 'TERMINATED';
              activePassContract.handoverRejected = true;
              activePassContract.rejectionReason = reason;
            }
            onCheckInSuccess?.();
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
    </>
  );
};
