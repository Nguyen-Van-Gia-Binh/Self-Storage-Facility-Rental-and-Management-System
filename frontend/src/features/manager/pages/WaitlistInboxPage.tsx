import React, { useCallback, useEffect, useState } from 'react';
import {
  Phone,
  PhoneCall,
  Lock,
  Clock,
  CheckCircle,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import {
  fetchFacilityWaitlists,
  startContacting,
  convertWaitlistToReservation,
  rejectWaitlist,
  followUpWaitlist,
} from '@/api/waitlist';
import { CreateDirectContractModal } from '@/features/manager/components/CreateDirectContractModal';
import type { WaitlistResponse } from '@/types/waitlist';
import type { FacilityListItem } from '@/types';
import { useCurrentUser } from '@/utils/useCurrentUser';

export const WaitlistInboxPage: React.FC = () => {
  const user = useCurrentUser();
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [waitlists, setWaitlists] = useState<WaitlistResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [convertModalItem, setConvertModalItem] = useState<WaitlistResponse | null>(null);
  const [convertStartDate, setConvertStartDate] = useState<string>('');
  const [convertMonths, setConvertMonths] = useState<number>(1);

  // Direct Contract Modal State
  const [directModalItem, setDirectModalItem] = useState<WaitlistResponse | null>(null);

  // Rescue Modal State (409 Conflict)
  const [rescueModalItem, setRescueModalItem] = useState<WaitlistResponse | null>(null);

  // Reject & FollowUp Modal State
  const [rejectModalItem, setRejectModalItem] = useState<WaitlistResponse | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const [followUpModalItem, setFollowUpModalItem] = useState<WaitlistResponse | null>(null);
  const [followUpNotes, setFollowUpNotes] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  // Load facilities
  useEffect(() => {
    fetchMyAssignedFacilities()
      .then((res) => {
        setFacilities(res);
        if (res.length > 0) {
          setSelectedFacilityId(res[0].id);
        }
      })
      .catch((err) => {
        showToast(err.message || 'Không thể tải danh sách cơ sở', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  // Load waitlists for facility
  const loadWaitlists = useCallback(async (facilityId: number) => {
    try {
      setLoading(true);
      const data = await fetchFacilityWaitlists(facilityId);
      setWaitlists(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err.message || 'Lỗi tải danh sách chờ', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      loadWaitlists(selectedFacilityId);
    }
  }, [selectedFacilityId, loadWaitlists]);

  // Handle Start Contacting
  const handleStartContacting = async (item: WaitlistResponse) => {
    try {
      setActionLoading(true);
      await startContacting(item.id);
      showToast('Đã bắt đầu tư vấn khách hàng');
      if (selectedFacilityId) loadWaitlists(selectedFacilityId);
    } catch (err: any) {
      showToast(err.message || 'Khách hàng này đang được nhân viên khác tư vấn', 'error');
      if (selectedFacilityId) loadWaitlists(selectedFacilityId);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Open Convert Modal
  const openConvertModal = (item: WaitlistResponse) => {
    setConvertModalItem(item);
    const today = new Date().toISOString().split('T')[0];
    const initialStart = item.targetStartDate >= today ? item.targetStartDate : today;
    setConvertStartDate(initialStart);
    setConvertMonths(item.rentalMonths || 1);
  };

  // Submit Convert to Reservation
  const handleConfirmConvert = async () => {
    if (!convertModalItem) return;
    try {
      setActionLoading(true);
      await convertWaitlistToReservation(convertModalItem.id, {
        startDate: convertStartDate,
        rentalMonths: convertMonths,
      });
      showToast('Chốt cọc thành công! Đã tạo đơn giữ chỗ 24h cho khách');
      setConvertModalItem(null);
      if (selectedFacilityId) loadWaitlists(selectedFacilityId);
    } catch (err: any) {
      if (err.status === 409 || err.errorCode === 'CAPACITY_NOT_AVAILABLE') {
        // Trigger Rescue Modal (Tech Lead requirement)
        setRescueModalItem(convertModalItem);
        setConvertModalItem(null);
      } else {
        showToast(err.message || 'Không thể tạo đơn đặt cọc', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Open Direct Contract Modal using unified CreateDirectContractModal
  const openDirectContractModal = (item: WaitlistResponse) => {
    setDirectModalItem(item);
  };

  // Submit Reject
  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    try {
      setActionLoading(true);
      await rejectWaitlist(rejectModalItem.id, { reason: rejectReason });
      showToast('Đã ghi nhận khách hàng từ chối');
      setRejectModalItem(null);
      setRejectReason('');
      if (selectedFacilityId) loadWaitlists(selectedFacilityId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi từ chối', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit FollowUp
  const handleConfirmFollowUp = async () => {
    if (!followUpModalItem) return;
    try {
      setActionLoading(true);
      await followUpWaitlist(followUpModalItem.id, { contactNotes: followUpNotes });
      showToast('Đã cập nhật ghi chú và mở khóa để hẹn gọi lại sau');
      setFollowUpModalItem(null);
      setFollowUpNotes('');
      if (selectedFacilityId) loadWaitlists(selectedFacilityId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu ghi chú', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered waitlists
  const safeWaitlists = Array.isArray(waitlists) ? waitlists : [];
  const filteredWaitlists = safeWaitlists.filter((item) => {
    const matchesStatus =
      statusFilter === 'ALL' || item.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.customerPhone && item.customerPhone.includes(searchTerm)) ||
      (item.unitTypeName && item.unitTypeName.toLowerCase().includes(searchTerm.toLowerCase()));
    return Boolean(matchesStatus && matchesSearch);
  });

  // KPI stats
  const countWaiting = safeWaitlists.filter((w) => w.status === 'WAITING').length;
  const countContacting = safeWaitlists.filter((w) => w.status === 'CONTACTING').length;
  const countFollowUp = safeWaitlists.filter((w) => w.status === 'PENDING_FOLLOW_UP').length;
  const countConverted = safeWaitlists.filter((w) => w.status === 'CONVERTED').length;

  return (
    <div className="space-y-6 p-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Chờ & Hộp thư Tư vấn (Telesales CRM)</h1>
          <p className="text-sm text-gray-500">
            Quản lý tư vấn khách hàng danh sách chờ, kiểm tra công suất trống và tạo hợp đồng trực tiếp hoặc đơn đặt cọc.
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Cơ sở:</label>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            value={selectedFacilityId ?? ''}
            onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
          >
            {facilities.length === 0 ? (
              <option value="">Chưa có cơ sở phân công</option>
            ) : (
              facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))
            )}
          </select>
          <button
            onClick={() => selectedFacilityId && loadWaitlists(selectedFacilityId)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đang chờ (FIFO)</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{countWaiting}</div>
          <p className="mt-1 text-xs text-gray-400">Khách đăng ký chưa tư vấn</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đang tư vấn</span>
            <PhoneCall className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{countContacting}</div>
          <p className="mt-1 text-xs text-gray-400">Đang tư vấn khách hàng</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hẹn gọi lại</span>
            <RefreshCw className="h-5 w-5 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600">{countFollowUp}</div>
          <p className="mt-1 text-xs text-gray-400">Khách bận / chăm sóc lại</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đã chốt cọc</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{countConverted}</div>
          <p className="mt-1 text-xs text-gray-400">Đơn cọc 24h thành công</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách, số điện thoại, loại kho..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm focus:border-teal-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="WAITING">Chờ tư vấn (WAITING)</option>
            <option value="CONTACTING">Đang liên hệ (CONTACTING)</option>
            <option value="PENDING_FOLLOW_UP">Hẹn gọi lại (FOLLOW_UP)</option>
            <option value="CONVERTED">Đã chốt cọc (CONVERTED)</option>
          </select>
        </div>
      </div>

      {/* CRM Inbox Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Đang tải danh sách chờ...</div>
        ) : filteredWaitlists.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Không có khách hàng nào trong danh sách chờ.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Loại kho & Sức chứa trống</th>
                  <th className="px-4 py-3">Ngày hẹn</th>
                  <th className="px-4 py-3">Trạng thái & Hạn tư vấn</th>
                  <th className="px-4 py-3 text-right">Thao tác CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWaitlists.map((item) => {
                  const isLockedByMe = item.assignedFmId === user?.id;
                  const isLockedByOther =
                    item.status === 'CONTACTING' &&
                    item.assignedFmId &&
                    item.assignedFmId !== user?.id &&
                    (item.remainingTimeoutSeconds ?? 0) > 0;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {/* Customer Info */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{item.customerName || 'Khách vãng lai'}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <Phone className="h-3 w-3 text-teal-600" />
                          <a href={`tel:${item.customerPhone}`} className="hover:underline font-mono">
                            {item.customerPhone || 'Chưa có SĐT'}
                          </a>
                        </div>
                        {item.customerEmail && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">{item.customerEmail}</div>
                        )}
                      </td>

                      {/* Unit Type & Available Capacity Badge */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{item.unitTypeName}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                              (item.availableCapacity ?? 0) > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(item.availableCapacity ?? 0) > 0
                              ? `Còn ${item.availableCapacity} ô trống`
                              : 'Hết công suất (0)'}
                          </span>
                          <span className="text-xs text-gray-400">Thuê {item.rentalMonths} tháng</span>
                        </div>
                      </td>

                      {/* Target Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {item.targetStartDate}
                        </div>
                      </td>

                      {/* Status & Countdown Timer */}
                      <td className="px-4 py-3">
                        {item.status === 'WAITING' && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                            Chờ liên hệ
                          </span>
                        )}

                        {item.status === 'CONTACTING' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                              <PhoneCall className="h-3 w-3 animate-pulse text-indigo-600" />
                              Đang tư vấn
                            </span>
                            {item.assignedFmName && (
                              <div className="text-xs text-gray-500">
                                Nhân sự: <span className="font-medium">{item.assignedFmName}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === 'PENDING_FOLLOW_UP' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                              Hẹn gọi lại sau
                            </span>
                            {item.contactNotes && (
                              <div className="text-xs text-purple-900 bg-purple-50 rounded p-1 max-w-xs italic">
                                &quot;{item.contactNotes}&quot;
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === 'CONVERTED' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3 w-3" />
                              {item.convertedContractId ? 'Đã tạo HĐ trực tiếp' : 'Đã chốt cọc (24h)'}
                            </span>
                            {item.convertedContractId ? (
                              <div className="text-xs font-mono text-teal-800 font-semibold">
                                HĐ #{item.convertedContractId}
                              </div>
                            ) : item.convertedReservationCode ? (
                              <div className="text-xs font-mono text-emerald-800">
                                {item.convertedReservationCode}
                              </div>
                            ) : null}
                          </div>
                        )}

                        {item.status === 'REJECTED' && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Khách từ chối
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {/* Case 1: Locked by another FM */}
                        {isLockedByOther ? (
                          <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
                            <Lock className="h-3.5 w-3.5" />
                            <span>Đang được FM {item.assignedFmName || 'khác'} xử lý</span>
                          </div>
                        ) : item.status === 'WAITING' || item.status === 'PENDING_FOLLOW_UP' ? (
                          /* Case 2: Available to start contacting */
                          <button
                            onClick={() => handleStartContacting(item)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            Bắt đầu tư vấn
                          </button>
                        ) : item.status === 'CONTACTING' && isLockedByMe ? (
                          /* Case 3: Locked by me -> Direct contract or Reservation */
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openDirectContractModal(item)}
                              disabled={actionLoading}
                              className="rounded-lg bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800"
                              title="Tạo hợp đồng trực tiếp tại quầy / chốt khách đặt trước dài hạn"
                            >
                              Tạo HĐ trực tiếp
                            </button>
                            <button
                              onClick={() => openConvertModal(item)}
                              disabled={actionLoading}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-700"
                              title="Tạo đơn giữ chỗ 24h chờ khách thanh toán online"
                            >
                              Tạo đơn cọc
                            </button>
                            <button
                              onClick={() => {
                                setFollowUpModalItem(item);
                                setFollowUpNotes(item.contactNotes || '');
                              }}
                              disabled={actionLoading}
                              className="rounded-lg border border-purple-300 bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                            >
                              Hẹn lại
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalItem(item);
                                setRejectReason('');
                              }}
                              disabled={actionLoading}
                              className="rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : item.status === 'CONVERTED' ? (
                          item.convertedContractId ? (
                            <span className="text-xs text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2 py-1 rounded-md">
                              HĐ #{item.convertedContractId} sẵn sàng
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-medium">Chờ thanh toán VNPay</span>
                          )
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Chốt đơn đặt cọc */}
      {convertModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Tạo đơn Đặt cọc Giữ chỗ (24 Giờ)</h3>
            <p className="mt-1 text-xs text-gray-500">
              Kiểm tra và cập nhật ngày bắt đầu thuê & thời hạn theo thỏa thuận trực tiếp qua điện thoại với khách.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Khách hàng</label>
                <div className="text-sm font-medium text-gray-800">{convertModalItem.customerName} ({convertModalItem.customerPhone})</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500">Hạng kho yêu cầu</label>
                <div className="text-sm font-medium text-teal-700">{convertModalItem.unitTypeName}</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Ngày bắt đầu thuê</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={convertStartDate}
                  onChange={(e) => setConvertStartDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Số tháng thuê</label>
                <input
                  type="number"
                  min={1}
                  value={convertMonths}
                  onChange={(e) => setConvertMonths(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConvertModalItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmConvert}
                disabled={actionLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                Xác nhận Tạo đơn Cọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Sử dụng chung CreateDirectContractModal hoàn chỉnh */}
      {directModalItem && (
        <CreateDirectContractModal
          isOpen={!!directModalItem}
          onClose={() => setDirectModalItem(null)}
          onSuccess={async (_contract, msg) => {
            showToast(msg || 'Tạo hợp đồng trực tiếp từ danh sách chờ thành công!', 'success');
            setDirectModalItem(null);
            if (selectedFacilityId) {
              await loadWaitlists(selectedFacilityId);
            }
          }}
          defaultFacilityId={selectedFacilityId ?? undefined}
          initialWaitlist={directModalItem}
        />
      )}

      {/* MODAL 2: Cứu cánh khi hết kho (409 Conflict) */}
      {rescueModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border-2 border-red-500">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Rất tiếc, Hạng kho này vừa hết chỗ!</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Trong lúc bạn đang gọi điện tư vấn, toàn bộ công suất trống của loại kho{' '}
                  <span className="font-semibold text-red-600">{rescueModalItem.unitTypeName}</span> đã bị khách hàng
                  khác đặt trước.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-gray-50 p-4 border border-gray-200">
              <div className="text-xs font-semibold uppercase text-gray-500 mb-2">Phương án xử lý tình huống:</div>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-teal-600" />
                  <strong>Phương án 1:</strong> Tư vấn khách nâng hạng kho (Upgrade) sang loại diện tích lớn hơn còn trống.
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-teal-600" />
                  <strong>Phương án 2:</strong> Tư vấn khách thuê tại chi nhánh/cơ sở lân cận của công ty.
                </li>
                <li className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-teal-600" />
                  <strong>Phương án 3:</strong> Giữ khách ở trạng thái Hẹn gọi lại để ưu tiên Top 1 khi có người trả kho.
                </li>
              </ul>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                onClick={() => setRescueModalItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setFollowUpModalItem(rescueModalItem);
                  setFollowUpNotes('Hết kho trống lúc tư vấn - Hẹn báo lại khi có kho trống');
                  setRescueModalItem(null);
                }}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
              >
                Lưu vào Hẹn gọi lại sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Hẹn gọi lại sau (Follow Up) */}
      {followUpModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Ghi chú & Hẹn gọi lại sau</h3>
            <p className="mt-1 text-xs text-gray-500">
              Nhập thông tin phản hồi từ khách (khách bận, cần suy nghĩ) để mở khóa cho ca sau hoặc tiếp tục chăm sóc.
            </p>

            <textarea
              rows={3}
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="VD: Khách đang họp, hẹn 15h gọi lại tư vấn tiếp..."
              className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setFollowUpModalItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmFollowUp}
                disabled={actionLoading}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Lưu Ghi Chú & Mở Khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Khách từ chối */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Ghi nhận Khách Từ chối</h3>
            <p className="mt-1 text-xs text-gray-500">
              Lưu lý do khách không còn nhu cầu để phục vụ phân tích báo cáo tỷ lệ chuyển đổi.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Khách đã tìm được kho khác / Giá không phù hợp..."
              className="mt-4 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalItem(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                Xác nhận Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default WaitlistInboxPage;

