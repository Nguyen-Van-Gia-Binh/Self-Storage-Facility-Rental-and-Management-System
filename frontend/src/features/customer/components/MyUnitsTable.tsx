import React, { useState } from 'react';
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
} from 'lucide-react';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { formatDateVN } from '../utils/unitPickerHelpers';
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
  renewalNoticeDays?: number;
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
  renewalNoticeDays,
}) => {
  const [activePassContract, setActivePassContract] = useState<RentedContract | null>(null);
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const togglePin = (contractId: string) => {
    setRevealedPins((prev) => ({ ...prev, [contractId]: !prev[contractId] }));
  };

  const totalItems = contracts.length + pendingReservations.length;

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
              <th className="py-3 px-4">Ô kho</th>
              <th className="py-3 px-4">Loại kho</th>
              <th className="py-3 px-4">Cơ sở</th>
              <th className="py-3 px-4">Thời hạn</th>
              <th className="py-3 px-4">Mã mở khóa</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {/* 1. Hàng cho Đơn đang giữ chỗ 48h */}
            {pendingReservations.map((rsv, idx) => {
              const bookingUrl = `/customer/booking?reservationId=${rsv.id}&facility=${rsv.facilityId}&type=${rsv.unitTypeId}${
                rsv.storageUnitId ? `&unitId=${rsv.storageUnitId}` : ''
              }${
                rsv.storageUnitCode ? `&unitNumber=${encodeURIComponent(rsv.storageUnitCode)}` : ''
              }&months=${rsv.rentalMonths}&startDate=${rsv.startDate}`;

              const isMenuOpen = openMenuId === `rsv-${rsv.id}`;
              const isLastRows = idx >= totalItems - 2;

              return (
                <tr key={`rsv-${rsv.id}`} className="hover:bg-rose-50/30 transition-colors">
                  {/* Cột 1: Ô kho (Chỉ mã ô kho) */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-extrabold text-sm text-slate-900 tracking-tight">
                    {rsv.storageUnitCode || rsv.code || 'Chưa xếp ô'}
                  </td>

                  {/* Cột 2: Loại kho (Text thuần) */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-600">
                    {(rsv.unitTypeName || 'Kho tiêu chuẩn').replace(/\s*\([^)]*\)/g, '').trim()}
                  </td>

                  {/* Cột 3: Cơ sở */}
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {rsv.facilityName || 'Cơ sở lưu trữ'}
                  </td>

                  {/* Cột 4: Thời hạn */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <span className="font-medium text-slate-900">{rsv.rentalMonths} tháng</span>
                      <p className="text-[11px] text-slate-400">Từ {formatDateVN(rsv.startDate)}</p>
                    </div>
                  </td>

                  {/* Cột 5: Mã mở khóa */}
                  <td className="py-3.5 px-4 text-slate-400 text-xs italic whitespace-nowrap">
                    Chờ thanh toán
                  </td>

                  {/* Cột 6: Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                      <Clock className="w-3 h-3 text-rose-600 animate-pulse" />
                      <span>Giữ chỗ 48h</span>
                    </span>
                  </td>

                  {/* Cột 7: Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <Link to={bookingUrl} className="shrink-0">
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
                              } w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1 text-xs`}
                            >
                              <button
                                type="button"
                                onClick={() => {
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
            })}

            {/* 2. Hàng cho Hợp đồng thuê kho */}
            {contracts.map((contract, idx) => {
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

              const isRevealed = Boolean(revealedPins[contract.id]);
              const isMenuOpen = openMenuId === `contract-${contract.id}`;
              const isLastRows = (pendingReservations.length + idx) >= totalItems - 2;

              // Kiểm tra xem hàng có thao tác phụ hay không
              const hasSecondaryActions =
                contract.status === 'PENDING_CHECKIN' ||
                (contract.status as string) === 'PENDING_CHECK_IN' ||
                contract.status === 'ACTIVE' ||
                (contract.status === 'PENDING_RETURN' && !contract.inspectionDone) ||
                contract.status === 'OVERDUE';

              return (
                <tr
                  key={contract.id}
                  className={`transition-colors ${
                    contract.status === 'OVERDUE'
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : isUrgentExpiring
                      ? 'bg-amber-50/20 hover:bg-amber-50/40'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  {/* Cột 1: Ô kho (Chỉ mã số ô kho) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight font-mono">
                      {contract.unitNumber}
                    </span>
                  </td>

                  {/* Cột 2: Loại kho (Text thuần, không label) */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs font-medium text-slate-600">
                    {(contract.unitTypeName || 'Kho tiêu chuẩn').replace(/\s*\([^)]*\)/g, '').trim()}
                  </td>

                  {/* Cột 3: Cơ sở */}
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                    {contract.facilityName}
                  </td>

                  {/* Cột 4: Thời hạn thuê */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                    {formatDateVN(contract.startDate)} → {formatDateVN(contract.endDate)}
                  </td>

                  {/* Cột 5: Mã mở khóa */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {contract.accessPin ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <span className="text-slate-400 text-[10px] font-medium">PIN:</span>
                        <span className="font-mono font-black text-slate-800 tracking-wider">
                          {isRevealed ? contract.accessPin : '••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePin(contract.id)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition-colors"
                          title={isRevealed ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : contract.status === 'PENDING_CHECKIN' ||
                      (contract.status as string) === 'PENDING_CHECK_IN' ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActivePassContract(contract)}
                        className="h-7 text-[11px] px-2.5 font-bold text-brand-700 border-brand-200 bg-brand-50/50 hover:bg-brand-50 whitespace-nowrap shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" />
                        Vé nhận kho
                      </Button>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">—</span>
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
                    ) : contract.status === 'PENDING_CHECKIN' ||
                      (contract.status as string) === 'PENDING_CHECK_IN' ? (
                      <Badge variant="reserved">Chờ nhận kho</Badge>
                    ) : contract.status === 'PENDING_RETURN' ? (
                      <Badge variant={contract.inspectionDone ? 'info' : 'warning'}>
                        {contract.inspectionDone ? 'Đã nghiệm thu' : 'Chờ nghiệm thu'}
                      </Badge>
                    ) : contract.status === 'CLOSED' || (contract.status as string) === 'TERMINATED' ? (
                      <Badge variant="default">Đã kết thúc</Badge>
                    ) : (
                      <Badge variant="default">{contract.status}</Badge>
                    )}
                  </td>

                  {/* Cột 7: Thao tác (Gọn gàng: Nút chính + menu •••) */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {/* 1. Nút hành động chính */}
                      {contract.status === 'OVERDUE' && penaltyFee > 0 ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => onOpenOverduePayment(contract)}
                          className="h-7 text-xs px-2.5 font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" />
                          Nộp phạt
                        </Button>
                      ) : contract.status === 'ACTIVE' && isExpiringSoon ? (
                        <Link to={`/customer/renew/${contract.id}`} className="shrink-0">
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
                          onClick={() => onViewDetail(contract)}
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
                                      onClick={() => {
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
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        onReschedulePeriod(contract);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer font-medium"
                                    >
                                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Đổi ngày nhận kho</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
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
                                    {!isExpiringSoon && (
                                      <Link
                                        to={`/customer/renew/${contract.id}`}
                                        onClick={() => setOpenMenuId(null)}
                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer font-medium"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Gia hạn hợp đồng</span>
                                      </Link>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
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
                                      onClick={() => {
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

      {/* Digital Move In Pass Modal */}
      {activePassContract && (
        <DigitalMoveInPassModal
          isOpen={Boolean(activePassContract)}
          onClose={() => setActivePassContract(null)}
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
