import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Clock,
  CheckCircle,
  Calendar,
  RefreshCw,
  Search,
  FileText,
  Archive,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import {
  fetchFacilityWaitlists,
  rejectWaitlist,
} from '@/api/waitlist';
import { CreateDirectContractModal } from '@/features/manager/components/CreateDirectContractModal';
import type { WaitlistResponse } from '@/types/waitlist';
import type { FacilityListItem } from '@/types';

export const WaitlistInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [waitlists, setWaitlists] = useState<WaitlistResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'CONVERTED' | 'ARCHIVED' | 'ALL'>('ACTIVE');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Direct Contract Modal State
  const [directModalItem, setDirectModalItem] = useState<WaitlistResponse | null>(null);

  // Archive (Soft-remove) Modal State
  const [archiveModalItem, setArchiveModalItem] = useState<WaitlistResponse | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');

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

  // Open Direct Contract Modal
  const openDirectContractModal = (item: WaitlistResponse) => {
    setDirectModalItem(item);
  };

  // Submit Archive (Soft-remove: status -> REJECTED / ARCHIVED)
  const handleConfirmArchive = async () => {
    if (!archiveModalItem) return;
    try {
      setActionLoading(true);
      await rejectWaitlist(archiveModalItem.id, {
        reason: archiveReason.trim() || 'Quản lý chuyển sang danh sách lưu trữ',
      });
      showToast('Đã chuyển khách hàng vào mục Lưu trữ an toàn (dữ liệu được bảo toàn)', 'success');
      setArchiveModalItem(null);
      setArchiveReason('');
      if (selectedFacilityId) await loadWaitlists(selectedFacilityId);
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu trữ khách hàng', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Safe list
  const safeWaitlists = Array.isArray(waitlists) ? waitlists : [];

  // Filtered waitlists
  const filteredWaitlists = safeWaitlists.filter((item) => {
    let matchesTab = true;
    if (statusTab === 'ACTIVE') {
      matchesTab = item.status === 'WAITING' || item.status === 'CONTACTING' || item.status === 'PENDING_FOLLOW_UP';
    } else if (statusTab === 'CONVERTED') {
      matchesTab = item.status === 'CONVERTED';
    } else if (statusTab === 'ARCHIVED') {
      matchesTab = item.status === 'REJECTED' || item.status === 'CANCELLED';
    }

    const matchesSearch =
      !searchTerm ||
      (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.customerPhone && item.customerPhone.includes(searchTerm)) ||
      (item.unitTypeName && item.unitTypeName.toLowerCase().includes(searchTerm.toLowerCase()));

    return Boolean(matchesTab && matchesSearch);
  });

  // KPI counts
  const countActive = safeWaitlists.filter(
    (w) => w.status === 'WAITING' || w.status === 'CONTACTING' || w.status === 'PENDING_FOLLOW_UP'
  ).length;
  const countConverted = safeWaitlists.filter((w) => w.status === 'CONVERTED').length;
  const countArchived = safeWaitlists.filter(
    (w) => w.status === 'REJECTED' || w.status === 'CANCELLED'
  ).length;

  // Priority rule check: Check if unassigned reservations exist
  const hasUnassignedReservations = safeWaitlists.some(
    (w) =>
      (w.status === 'WAITING' || w.status === 'CONTACTING' || w.status === 'PENDING_FOLLOW_UP') &&
      (w.unassignedReservationCount ?? 0) > 0
  );
  const totalUnassignedCount = safeWaitlists.reduce(
    (max, w) => Math.max(max, w.unassignedReservationCount ?? 0),
    0
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Danh sách Chờ (Waitlist)</h1>
          <p className="text-sm text-gray-500">
            Quản lý khách hàng đang chờ thuê kho khi cơ sở hết chỗ và hỗ trợ tạo hợp đồng trực tiếp.
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
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Priority Alert Banner if unassigned reservations exist */}
      {hasUnassignedReservations && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 text-amber-800 font-bold text-sm shrink-0 mt-0.5">
                ⚠️
              </span>
              <div>
                <h4 className="font-bold text-sm text-amber-900">
                  CẢNH BÁO QUY CHẾ ƯU TIÊN: Đang có {totalUnassignedCount} đơn đặt chỗ online chờ gán ô kho
                </h4>
                <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                  Cơ sở đang có khách hàng đã thanh toán cọc giữ chỗ trước nhưng chưa được gán ô kho vật lý.
                  Hệ thống tạm khóa phân bổ Danh sách chờ (Waitlist) nhằm bảo đảm ô kho cho khách đặt trước theo đúng quy chuẩn nghiệp vụ.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/manager/allocation?facilityId=${selectedFacilityId}`)}
              className="shrink-0 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-800 transition flex items-center gap-1.5"
            >
              Đi đến Gán ô kho cho khách đặt trước →
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards (Clean 3 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Khách đang chờ</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{countActive}</div>
          <p className="mt-1 text-xs text-gray-400">Khách hàng cần phục vụ trong danh sách chờ</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đã chốt hợp đồng</span>
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{countConverted}</div>
          <p className="mt-1 text-xs text-gray-400">Đã tạo hợp đồng thành công từ danh sách chờ</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Đã lưu trữ / Gỡ bỏ</span>
            <Archive className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-600">{countArchived}</div>
          <p className="mt-1 text-xs text-gray-400">Dữ liệu được lưu trữ an toàn, không bị xóa</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Segmented Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusTab === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang chờ ({countActive})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('CONVERTED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusTab === 'CONVERTED'
                ? 'bg-white text-emerald-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã tạo HĐ ({countConverted})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('ARCHIVED')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusTab === 'ARCHIVED'
                ? 'bg-white text-slate-800 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã lưu trữ ({countArchived})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({safeWaitlists.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm tên, SĐT, loại kho..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-1.5 text-xs focus:border-teal-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Waitlist Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-gray-500">Đang tải danh sách chờ...</div>
        ) : filteredWaitlists.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            {statusTab === 'ACTIVE'
              ? 'Không có khách hàng nào trong danh sách chờ.'
              : statusTab === 'CONVERTED'
              ? 'Chưa có hợp đồng nào được tạo từ danh sách chờ.'
              : statusTab === 'ARCHIVED'
              ? 'Chưa có khách hàng nào trong mục lưu trữ.'
              : 'Không có khách hàng nào trong danh sách chờ.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Loại kho nhu cầu</th>
                  <th className="px-4 py-3">Ngày mong muốn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWaitlists.map((item) => {
                  const isActive =
                    item.status === 'WAITING' ||
                    item.status === 'CONTACTING' ||
                    item.status === 'PENDING_FOLLOW_UP';
                  const isConverted = item.status === 'CONVERTED';
                  const isArchived = item.status === 'REJECTED' || item.status === 'CANCELLED';

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

                      {/* Unit Type (Completely removed capacity badges like 'Hết công suất (0)' as requested) */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.unitTypeName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Thuê {item.rentalMonths} tháng</div>
                        {(item.unassignedReservationCount ?? 0) > 0 && (
                          <div className="mt-1">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                              ⚠️ Ưu tiên {item.unassignedReservationCount} đơn đặt trước
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Target Date */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {item.targetStartDate}
                        </div>
                      </td>

                      {/* Clean Status */}
                      <td className="px-4 py-3">
                        {isConverted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Đã tạo HĐ
                          </span>
                        ) : isArchived ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                            <Archive className="h-3 w-3 text-slate-400" />
                            Đã lưu trữ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                            <Clock className="h-3.5 w-3.5" />
                            Đang chờ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isActive ? (
                          <div className="flex items-center justify-end gap-2">
                            {(item.unassignedReservationCount ?? 0) > 0 ? (
                              <button
                                type="button"
                                onClick={() => navigate(`/manager/allocation?facilityId=${selectedFacilityId}`)}
                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 flex items-center gap-1 shrink-0"
                                title={`Đang có ${item.unassignedReservationCount} khách đặt trước chưa gán ô kho. Theo quy chế ưu tiên, cần hoàn tất gán ô kho cho khách đặt trước tại mục "Gán ô kho"!`}
                              >
                                Gán ô kho ({item.unassignedReservationCount})
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openDirectContractModal(item)}
                                disabled={actionLoading}
                                className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                title="Tạo hợp đồng trực tiếp cho khách hàng từ danh sách chờ"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Tạo HĐ trực tiếp
                              </button>
                            )}

                            {/* Nút Remove / Lưu trữ: Chuyển sang mục lưu trữ, không xóa mất dữ liệu khách hàng */}
                            <button
                              type="button"
                              onClick={() => {
                                setArchiveModalItem(item);
                                setArchiveReason('');
                              }}
                              disabled={actionLoading}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-rose-600 flex items-center gap-1 transition-colors shrink-0"
                              title="Gỡ khỏi danh sách chờ và chuyển sang mục lưu trữ an toàn (không xóa dữ liệu)"
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Gỡ / Lưu trữ
                            </button>
                          </div>
                        ) : isConverted ? (
                          <span className="text-xs text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md inline-block">
                            {item.convertedContractId
                              ? `HĐ #${item.convertedContractId}`
                              : item.convertedReservationCode || 'Đã tạo HĐ'}
                          </span>
                        ) : isArchived ? (
                          <span className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 px-2 py-1 rounded-md inline-block">
                            {item.contactNotes || 'Đã lưu trữ'}
                          </span>
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

      {/* MODAL 1: Tạo Hợp Đồng Trực Tiếp */}
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

      {/* MODAL 2: Gỡ khỏi danh sách chờ & Chuyển sang Lưu Trữ (Bảo toàn dữ liệu khách hàng) */}
      {archiveModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                <Archive className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Gỡ khỏi danh sách & Lưu trữ</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Khách hàng <strong>{archiveModalItem.customerName || 'Khách hàng'}</strong> ({archiveModalItem.customerPhone || 'Không có SĐT'}) sẽ được chuyển sang mục <strong>Đã lưu trữ</strong>.
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                Dữ liệu khách hàng được bảo toàn:
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Hệ thống chỉ thay đổi trạng thái sang Lưu trữ chứ không xóa bản ghi CSDL, giúp bạn có thể tra cứu lại bất cứ lúc nào tại tab &quot;Đã lưu trữ&quot;.
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Lý do gỡ / Ghi chú lưu trữ:
              </label>
              <textarea
                rows={3}
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="VD: Khách không còn nhu cầu / Đã tìm được chỗ khác / Dời lịch..."
                className="w-full rounded-xl border border-gray-300 p-3 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setArchiveModalItem(null)}
                disabled={actionLoading}
                className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={actionLoading}
                className="rounded-xl bg-slate-800 hover:bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {actionLoading ? 'Đang lưu trữ...' : 'Xác nhận Lưu trữ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistInboxPage;
