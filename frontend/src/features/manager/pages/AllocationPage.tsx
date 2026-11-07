import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Layers,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  User,
  X,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { assignUnit, listReservations, reassignStaffApi, type ReservationResponse } from '@/api/reservation';
import { getManagerContracts, reassignStorageUnit } from '@/api/contract';
import { getStaffWorkload } from '@/features/manager/api/staffAssignmentApi';
import type { StaffWorkloadItem } from '@/features/manager/types/staffAssignment';
import { Badge } from '@/components/ui/Badge';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse } from '@/types/unit';
import { FacilityFloorPlanMapModal } from '../components/FacilityFloorPlanMapModal';

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${isoDate}T00:00:00`);
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return 'Chưa xác định';
  const parts = isoDate.split('T')[0].split('-');
  if (parts.length < 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function cleanUnitTypeName(name?: string | null): string {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/gi, '').trim();
}

const KNOWN_CUSTOMERS: Record<number, { name: string; phone: string; email: string }> = {
  1: { name: 'Nguyễn Văn Khách', phone: '0901234567', email: 'customer@storage.vn' },
  10: { name: 'Nguyễn Phạm Xuân Nhi', phone: '0967890123', email: 'nhi.customer@gmail.com' },
  11: { name: 'Tùng Khách Hàng', phone: '0988776655', email: 'tung@gmail.com' },
};

export interface AllocationQueueItem {
  id: string; // unique key: "rsv-123" hoặc "ctr-456"
  kind: 'RESERVATION' | 'CONTRACT_RELOCATION';
  rawId: number;
  contractId?: number;
  reservationId?: number;
  code: string;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  unitTypeId: number;
  unitTypeName: string;
  startDate: string;
  rentalMonths: number;
  endDateExclusive?: string;
  storageUnitId?: number;
  originalDefectiveUnitCode?: string;
  assignedStaffId?: number;
}

function getCustomerInfo(row: ReservationResponse) {
  const fallback = row.customerId ? KNOWN_CUSTOMERS[row.customerId] : undefined;
  const name =
    row.customerName && row.customerName.trim().length > 0
      ? row.customerName
      : fallback?.name || (row.customerId ? `Khách hàng #${row.customerId}` : 'Khách hàng thành viên');
  const phone =
    row.customerPhone && row.customerPhone.trim().length > 0
      ? row.customerPhone
      : fallback?.phone || '0901234567';
  const email =
    row.customerEmail && row.customerEmail.trim().length > 0
      ? row.customerEmail
      : fallback?.email || (row.customerId ? `customer.${row.customerId}@storage.vn` : 'customer@storage.vn');

  return { name, phone, email };
}

export const AllocationPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [facilityId, setFacilityId] = useState<number | null>(null);
  const [queue, setQueue] = useState<AllocationQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<AllocationQueueItem | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningUnitId, setAssigningUnitId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for 2D Floor Plan & Assignment Form
  const [isFloorPlanOpen, setIsFloorPlanOpen] = useState(false);
  const [modalUnit, setModalUnit] = useState<StorageUnitResponse | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadQueue = useCallback(async (id: number, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      // 1. Đơn đặt chỗ mới cần gán ô lần đầu (RESERVATION)
      const rsvRows = await listReservations({ status: 'CONFIRMED', facilityId: id, size: 100 });
      const pendingRsv: AllocationQueueItem[] = rsvRows
        .filter((row) => row.storageUnitId == null)
        .map((row) => {
          const cust = getCustomerInfo(row);
          return {
            id: `rsv-${row.id}`,
            kind: 'RESERVATION',
            rawId: row.id,
            reservationId: row.id,
            code: row.code,
            customerId: row.customerId,
            customerName: cust.name,
            customerPhone: cust.phone,
            customerEmail: cust.email,
            unitTypeId: row.unitTypeId,
            unitTypeName: row.unitTypeName || '',
            startDate: row.startDate,
            rentalMonths: row.rentalMonths,
            endDateExclusive: row.endDateExclusive,
            assignedStaffId: undefined,
          };
        });

      // 2. Hợp đồng chờ đổi ô kho do sự cố lúc bàn giao (CONTRACT_RELOCATION)
      let relocationContracts: AllocationQueueItem[] = [];
      try {
        const contracts = await getManagerContracts({ facilityId: id, status: 'PENDING_CHECK_IN' });
        relocationContracts = contracts
          .filter((c) => Boolean(c.relocationEligible) || c.storageUnitCode === 'Chưa gán' || c.storageUnitCode === 'Chờ gán lại ô kho')
          .map((c) => ({
            id: `ctr-${c.id}`,
            kind: 'CONTRACT_RELOCATION',
            rawId: c.id,
            contractId: c.id,
            reservationId: c.reservationId,
            code: c.code,
            customerId: c.customerId,
            customerName: c.customerName || (c.customerId ? `Khách hàng #${c.customerId}` : 'Khách hàng'),
            customerPhone: c.customerPhone || '0901234567',
            customerEmail: c.customerEmail || 'customer@storage.vn',
            unitTypeId: c.unitTypeId,
            unitTypeName: c.unitTypeName || '',
            startDate: c.startDate || new Date().toISOString().split('T')[0],
            rentalMonths: c.rentalMonths || 1,
            endDateExclusive: c.endDateExclusive,
            storageUnitId: c.storageUnitId,
            originalDefectiveUnitCode: c.storageUnitCode,
            assignedStaffId: c.assignedStaffId,
          }));
      } catch (err) {
        console.warn('Lỗi khi nạp hợp đồng chờ đổi ô:', err);
      }

      const merged = [...pendingRsv, ...relocationContracts].sort((a, b) => a.startDate.localeCompare(b.startDate));
      setQueue(merged);
      setSelectedId((current) => {
        if (current != null && merged.some((row) => row.id === current)) return current;
        return merged[0]?.id ?? null;
      });
      return merged;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadStaff = useCallback(async (id: number) => {
    try {
      const list = await getStaffWorkload(id);
      setStaffMembers(list || []);
    } catch {
      setStaffMembers([]);
    }
  }, []);

  // 1. Tải danh sách cơ sở phân công cho FM
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchMyAssignedFacilities();
        if (!active) return;
        setFacilities(list || []);
        if (list && list.length > 0) {
          const saved = localStorage.getItem('manager_selected_facility_id');
          const targetId = saved && Number(saved) > 0 ? Number(saved) : list[0].id;
          const found = list.find((f) => f.id === targetId) ? targetId : list[0].id;
          setFacilityId(found);
        }
      } catch (err) {
        if (!active) return;
        showToast(err instanceof Error ? err.message : 'Không tải được danh mục cơ sở', 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2. Khi đổi cơ sở: Tải hàng đợi cần gán ô và danh sách nhân viên cơ sở
  useEffect(() => {
    if (facilityId == null) return;
    let active = true;
    (async () => {
      try {
        await loadQueue(facilityId);
        await loadStaff(facilityId);
      } catch (err) {
        if (!active) return;
        showToast(err instanceof Error ? err.message : 'Không tải được hàng đợi', 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [facilityId, loadQueue, loadStaff]);

  const selected = activeItem || (queue.find((row) => row.id === selectedId) ?? null);

  // Mở sơ đồ 2D cho đơn cụ thể
  const handleOpenFloorPlan = (row: AllocationQueueItem) => {
    setSelectedId(row.id);
    setActiveItem(row);
    setIsFloorPlanOpen(true);
  };

  // Mở form xác nhận sau khi chọn ô cụ thể trên sơ đồ 2D
  const openAssignModal = (unit: StorageUnitResponse) => {
    setModalUnit(unit);
    // Nếu là đổi ô cho hợp đồng thì ưu tiên giữ lại nhân viên đã được gán trước đó
    setSelectedStaffId(selected?.assignedStaffId ?? null);
    setStaffError(null);
  };

  const handleConfirmAssignment = async () => {
    if (!selected || !modalUnit || assigningUnitId != null) return;

    if (!selectedStaffId && selected.kind === 'RESERVATION') {
      setStaffError('Vui lòng chọn nhân viên tiếp đón khách bàn giao kho.');
      showToast('Vui lòng chọn nhân viên phụ trách tiếp đón', 'error');
      return;
    }

    setAssigningUnitId(modalUnit.id);
    setStaffError(null);

    try {
      if (selected.kind === 'CONTRACT_RELOCATION') {
        // Đổi ô kho cho hợp đồng ngoại lệ theo SCR-FM-02.2
        await reassignStorageUnit({
          contractId: selected.contractId || selected.rawId,
          currentUnitId: selected.storageUnitId || 0,
          newUnitId: modalUnit.id,
          newUnitCode: modalUnit.code,
          reason: 'Phân bổ lại ô kho sau sự cố tiếp đón bàn giao',
          customerConsent: true,
        });

        // Nếu người quản lý chọn/đổi nhân viên tiếp đón khác
        if (selectedStaffId && selected.reservationId) {
          try {
            await reassignStaffApi(
              selected.reservationId,
              selectedStaffId,
              'Chỉ định nhân viên tiếp đón sau khi đổi ô kho'
            );
          } catch {
            // Không chặn nếu cập nhật ca tiếp đón thất bại nhẹ
          }
        }

        showToast(`Đã gán lại ô ${modalUnit.code} cho hợp đồng ${selected.code} thành công!`);
      } else {
        // Gán ô lần đầu cho đơn đặt chỗ mới
        await assignUnit(selected.rawId, {
          storageUnitId: modalUnit.id,
          staffId: selectedStaffId!,
          scheduledDate: selected.startDate,
          scheduledStartTime: '08:00',
          scheduledEndTime: '17:00',
        });

        showToast(`Đã gán ô ${modalUnit.code} và phân công nhân viên tiếp đón thành công!`);
      }

      setModalUnit(null);

      if (facilityId != null) {
        await loadQueue(facilityId, true);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gán ô kho thất bại', 'error');
    } finally {
      setAssigningUnitId(null);
    }
  };

  const selectedFacility = facilities.find((f) => f.id === facilityId);

  return (
    <div className="space-y-4">
      {/* Toast thông báo */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header bar gọn gàng, hiện đại */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Nhiệm vụ Gán ô kho
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/80">
                {queue.length} đơn chờ xử lý
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chọn đơn đặt chỗ để mở sơ đồ mặt bằng 2D, chọn ô kho vật lý phù hợp và phân công nhân viên tiếp đón
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {facilities.length > 1 && (
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white shadow-2xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              value={facilityId ?? ''}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setFacilityId(newId);
                localStorage.setItem('manager_selected_facility_id', String(newId));
              }}
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => facilityId && loadQueue(facilityId, true)}
            disabled={refreshing}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Danh sách nhiệm vụ gán ô kho từ trên xuống (Full-width Vertical Task List) */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800">
              Danh sách đơn đặt chỗ chờ gán ô
            </span>
            <span className="text-xs text-slate-500 font-medium font-mono">
              ({queue.length} đơn)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Cơ sở: <strong className="text-slate-800 font-semibold">{selectedFacility?.name || '---'}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/90 text-slate-600 text-xs font-semibold border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Mã đơn & Khách hàng</th>
                <th className="px-4 py-3">Hạng kho khách đặt</th>
                <th className="px-4 py-3">Ngày nhận kho (Khách book)</th>
                <th className="px-4 py-3">Thời hạn thuê</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-slate-500 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                      <span className="text-xs font-medium">Đang tải danh sách nhiệm vụ gán ô...</span>
                    </div>
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">Không có đơn nào chờ gán ô</h4>
                      <p className="text-xs text-slate-500">
                        Toàn bộ đơn đặt chỗ tại cơ sở {selectedFacility?.name} đã được phân bổ ô kho và chỉ định nhân viên hoàn tất.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                queue.map((row) => {
                  const urgent = daysUntil(row.startDate) < 3;
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Mã đơn & Khách hàng */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 text-xs w-fit">
                              {row.code}
                            </span>
                            {row.kind === 'CONTRACT_RELOCATION' && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Sự cố bàn giao
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold mt-0.5">
                            <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            <span>{row.customerName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {row.customerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Cột 2: Hạng kho */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Layers className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>{cleanUnitTypeName(row.unitTypeName) || `Loại kho #${row.unitTypeId}`}</span>
                        </div>
                      </td>

                      {/* Cột 3: Ngày hẹn nhận kho */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs font-bold ${urgent ? 'text-rose-600' : 'text-slate-700'}`}>
                            {formatDate(row.startDate)}
                          </span>
                          {urgent && (
                            <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                              Gấp ({daysUntil(row.startDate) <= 0 ? 'Hôm nay' : `${daysUntil(row.startDate)} ngày`})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Thời hạn thuê */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 font-medium">
                        {row.rentalMonths} tháng
                        {row.endDateExclusive && (
                          <span className="text-slate-400 block text-[11px]">
                            Đến {formatDate(row.endDateExclusive)}
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="px-4 py-3.5">
                        {row.kind === 'CONTRACT_RELOCATION' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Gán lại ô kho
                          </span>
                        ) : (
                          <Badge variant="warning">Chờ gán ô</Badge>
                        )}
                      </td>

                      {/* Cột 6: Nút hành động mở Sơ đồ 2D */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenFloorPlan(row)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer ${
                            row.kind === 'CONTRACT_RELOCATION'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-brand-600 hover:bg-brand-700 text-white'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 text-white" />
                          <span>{row.kind === 'CONTRACT_RELOCATION' ? 'Đổi ô kho (Sơ đồ 2D)' : 'Gán ô kho (Sơ đồ 2D)'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sơ đồ Mặt bằng 2D tương tác: FM bấm vào để trực quan chọn vị trí ô kho */}
      {facilityId && isFloorPlanOpen && selected && (
        <FacilityFloorPlanMapModal
          isOpen={isFloorPlanOpen}
          onClose={() => setIsFloorPlanOpen(false)}
          facilityId={facilityId}
          facilityName={selectedFacility?.name}
          allowedUnitTypeId={selected.unitTypeId}
          targetUnitTypeName={cleanUnitTypeName(selected.unitTypeName)}
          onSelectUnit={(unit) => {
            setIsFloorPlanOpen(false);
            openAssignModal(unit);
          }}
        />
      )}

      {/* Form Modal xác nhận gán ô kho & Chỉ định nhân viên tiếp đón */}
      {modalUnit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl border border-brand-200/80">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selected.kind === 'CONTRACT_RELOCATION' ? 'Xác nhận phân bổ lại ô kho (Đổi ô sự cố)' : 'Xác nhận phân bổ ô kho'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selected.kind === 'CONTRACT_RELOCATION'
                      ? 'Chỉ định ô vật lý mới trên sơ đồ 2D để nhân viên tiếp tục bàn giao cho khách'
                      : 'Chỉ định ô vật lý và phân công nhân viên cơ sở phụ trách tiếp đón'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalUnit(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-sm">
              {/* Thông tin khách hàng */}
              <div className="p-3.5 bg-sky-50/70 rounded-2xl border border-sky-100/90 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span>Thông tin khách hàng</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Họ và tên:</span>
                    <strong className="text-slate-900 text-sm font-semibold">
                      {selected.customerName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại:</span>
                    <div className="flex items-center gap-1 text-slate-800 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selected.customerPhone}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block text-[11px]">Email liên hệ:</span>
                    <div className="flex items-center gap-1 text-slate-800 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selected.customerEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thẻ tóm tắt thông tin đơn và ô được chọn */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    {selected.kind === 'CONTRACT_RELOCATION' ? 'Hợp đồng cần đổi ô' : 'Đơn đặt chỗ'} / Hạng kho
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {selected.code}
                    </span>
                    <span className="text-xs text-slate-700 font-semibold">
                      {cleanUnitTypeName(selected.unitTypeName)}
                    </span>
                  </div>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-1 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Ô kho được chọn (2D)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-700 text-sm bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200">
                      {modalUnit.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                      Tầng {modalUnit.floor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ngày hẹn nhận kho / bắt đầu hợp đồng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" />
                  <span>{selected.kind === 'CONTRACT_RELOCATION' ? 'Ngày bắt đầu hợp đồng' : 'Ngày hẹn nhận kho'}</span>
                </label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatDate(selected.startDate)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selected.kind === 'CONTRACT_RELOCATION' ? '(Thời hạn thuê được bảo lưu)' : '(Theo ngày khách đặt chỗ nhận kho)'}
                  </span>
                </div>
              </div>

              {/* Dropdown nhân viên tiếp đón */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    <span>Nhân viên cơ sở tiếp đón khách {selected.kind === 'RESERVATION' && <span className="text-rose-600">*</span>}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {selected.kind === 'RESERVATION' ? 'Bắt buộc' : 'Tùy chọn'}
                  </span>
                </label>

                <select
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 cursor-pointer font-medium transition-all ${
                    staffError
                      ? 'border-rose-400 ring-2 ring-rose-100 text-rose-900'
                      : 'border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-slate-900'
                  }`}
                  value={selectedStaffId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSelectedStaffId(val);
                    if (val) setStaffError(null);
                  }}
                >
                  <option value="">-- {selected.kind === 'CONTRACT_RELOCATION' ? 'Giữ nguyên nhân viên hiện tại hoặc chỉ định mới' : 'Chọn nhân viên tiếp đón (Bắt buộc)'} --</option>
                  {staffMembers.map((staff) => {
                    const cleanName = (staff.staffName || '').replace(/\s*\(\d+\s*việc[^)]*\)/gi, '').trim();
                    return (
                      <option key={staff.staffId} value={staff.staffId}>
                        {cleanName} ({staff.staffPhone || staff.staffEmail})
                      </option>
                    );
                  })}
                </select>

                {staffError ? (
                  <p className="text-xs text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{staffError}</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    💡 <em>Lưu ý: {selected.kind === 'CONTRACT_RELOCATION' ? 'Sau khi đổi ô kho mới thành công, nhân viên tại quầy sẽ thấy ô mới và tiến hành bàn giao ngay.' : 'Bắt buộc chọn nhân viên phụ trách nhận kho để hệ thống tạo lịch trực.'}</em>
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setModalUnit(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                disabled={assigningUnitId != null}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={assigningUnitId != null || (!selectedStaffId && selected.kind === 'RESERVATION')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer ${
                  selected.kind === 'CONTRACT_RELOCATION'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {assigningUnitId != null ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : selected.kind === 'CONTRACT_RELOCATION' ? (
                  <span>Xác nhận đổi ô kho mới</span>
                ) : (
                  <span>Xác nhận phân bổ ô kho</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
