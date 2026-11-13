import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { assignUnit, listReservations, reassignStaffApi, type ReservationResponse } from '@/api/reservation';
import { getManagerContracts, reassignStorageUnit } from '@/api/contract';
import type { ManagerContractItem } from '@/types/contractManager';
import { getStaffWorkload } from '@/features/manager/api/staffAssignmentApi';
import type { StaffWorkloadItem } from '@/features/manager/types/staffAssignment';
import { Badge } from '@/components/ui/Badge';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse } from '@/types/unit';
import { tokenStorage } from '@/utils/tokenStorage';
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
  facilityId: number;
  facilityName: string;
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
  storageUnitCode?: string;
  originalDefectiveUnitCode?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  isAssigned: boolean;
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
  const [facilitiesLoading, setFacilitiesLoading] = useState<boolean>(true);
  const [facilityId, setFacilityId] = useState<number | null>(() => {
    const saved = localStorage.getItem('manager_selected_facility_id');
    if (saved === 'ALL') return null;
    if (saved && Number(saved) > 0) return Number(saved);
    const user = tokenStorage.getUser();
    return user?.facilityId ? Number(user.facilityId) : null;
  });
  const [isFacilityResolved, setIsFacilityResolved] = useState<boolean>(() => {
    const saved = localStorage.getItem('manager_selected_facility_id');
    if (saved === 'ALL') return true;
    if (saved && Number(saved) > 0) return true;
    const user = tokenStorage.getUser();
    return Boolean(user?.facilityId);
  });
  const facilitiesRef = React.useRef<FacilityListItem[]>(facilities);
  facilitiesRef.current = facilities;
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
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

  const loadQueue = useCallback(async (id: number | null, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      // 1. Tải danh sách đơn đặt chỗ đã thanh toán (CONFIRMED) và hợp đồng chờ nhận kho (PENDING_CHECK_IN)
      const rsvParams: { status: string; facilityId?: number; size: number } = {
        status: 'CONFIRMED',
        size: 100,
      };
      if (id && id > 0) {
        rsvParams.facilityId = id;
      }
      const rsvRows = await listReservations(rsvParams);

      let contracts: ManagerContractItem[] = [];
      try {
        const contractFilter: { facilityId?: number; status: string } = {
          status: 'PENDING_CHECK_IN',
        };
        if (id && id > 0) {
          contractFilter.facilityId = id;
        }
        const contractsRes = await getManagerContracts(contractFilter);
        contracts = Array.isArray(contractsRes)
          ? contractsRes
          : ((contractsRes as unknown as { content?: ManagerContractItem[] })?.content || []);
      } catch (err) {
        console.warn('Lỗi khi nạp hợp đồng chờ nhận kho:', err);
      }

      const matchedRsvIds = new Set<number>();
      const matchedContractIds = new Set<number>();
      const matchedContractCodes = new Set<string>();

      for (const c of contracts) {
        if (c.reservationId != null) matchedRsvIds.add(c.reservationId);
        if (c.id != null) matchedContractIds.add(c.id);
        if (c.code) matchedContractCodes.add(c.code);

        // Quét rsvRows để khớp ngược bất kỳ đơn nào cùng hợp đồng hoặc thông tin đặt chỗ
        const matchedRsv = rsvRows.find(
          (r) =>
            (c.reservationId != null && r.id === c.reservationId) ||
            (r.contractId != null && r.contractId === c.id) ||
            (r.contractCode != null && r.contractCode === c.code) ||
            (r.customerId === c.customerId &&
              r.unitTypeId === c.unitTypeId &&
              r.startDate === c.startDate)
        );
        if (matchedRsv) {
          matchedRsvIds.add(matchedRsv.id);
        }
      }

      // 2. Hợp đồng chờ nhận kho: Bao gồm cả đơn chưa gán ô lẫn đơn đã gán ô (để FM có thể đổi ô trước ngày nhận theo BR-AVL-04)
      const pendingContractAllocations: AllocationQueueItem[] = contracts
        .filter((c) => {
          const isRelocation =
            Boolean(c.relocationEligible) ||
            c.status === 'RELOCATION_PENDING' ||
            c.storageUnitCode === 'Chờ gán lại ô kho';
          return !isRelocation;
        })
        .map((c) => {
          const matchedRsv = rsvRows.find(
            (r) =>
              (c.reservationId != null && r.id === c.reservationId) ||
              (r.contractId != null && r.contractId === c.id) ||
              (r.contractCode != null && r.contractCode === c.code) ||
              (r.storageUnitId == null &&
                r.customerId === c.customerId &&
                r.unitTypeId === c.unitTypeId &&
                r.startDate === c.startDate)
          );
          if (matchedRsv) {
            matchedRsvIds.add(matchedRsv.id);
          }
          const resolvedRsvId = c.reservationId ?? matchedRsv?.id;
          const cust = matchedRsv ? getCustomerInfo(matchedRsv) : null;
          const isUnassigned =
            c.storageUnitId == null ||
            c.storageUnitCode === 'Chưa gán' ||
            c.storageUnitCode === '';
          const isAssigned = !isUnassigned;

          return {
            id: resolvedRsvId != null ? `rsv-${resolvedRsvId}` : `ctr-${c.id}`,
            kind: 'RESERVATION' as const,
            rawId: resolvedRsvId ?? c.id,
            reservationId: resolvedRsvId,
            contractId: c.id,
            code: c.code,
            facilityId: c.facilityId || (id && id > 0 ? id : 0),
            facilityName: c.facilityName || '',
            customerId: c.customerId ?? matchedRsv?.customerId,
            customerName:
              c.customerName ||
              cust?.name ||
              (c.customerId ? `Khách hàng #${c.customerId}` : 'Khách hàng'),
            customerPhone: c.customerPhone || cust?.phone || '0901234567',
            customerEmail: c.customerEmail || cust?.email || 'customer@storage.vn',
            unitTypeId: c.unitTypeId,
            unitTypeName: c.unitTypeName || matchedRsv?.unitTypeName || '',
            startDate: c.startDate || matchedRsv?.startDate || new Date().toISOString().split('T')[0],
            rentalMonths: c.rentalMonths || matchedRsv?.rentalMonths || 1,
            endDateExclusive: c.endDateExclusive || matchedRsv?.endDateExclusive,
            storageUnitId: isAssigned ? (c.storageUnitId ?? matchedRsv?.storageUnitId) : undefined,
            storageUnitCode: isAssigned ? (c.storageUnitCode ?? matchedRsv?.storageUnitCode) : undefined,
            assignedStaffId: c.assignedStaffId,
            assignedStaffName: c.assignedStaffName,
            isAssigned,
          };
        });

      // 3. Fallback cho các đơn CONFIRMED (chưa nằm trong danh sách hợp đồng trên, chỉ giữ đơn đang PENDING_CHECK_IN)
      const pendingRsv: AllocationQueueItem[] = rsvRows
        .filter((row) => {
          if (matchedRsvIds.has(row.id)) return false;
          if (row.contractId != null && matchedContractIds.has(row.contractId)) return false;
          if (row.contractCode && matchedContractCodes.has(row.contractCode)) return false;
          if (row.contractStatus && row.contractStatus !== 'PENDING_CHECK_IN') return false;
          if (contracts.length > 0 && !row.contractCode) return false;
          return true;
        })
        .map((row) => {
          const cust = getCustomerInfo(row);
          const isAssigned = Boolean(row.storageUnitId && row.storageUnitCode && row.storageUnitCode !== 'Chưa gán');
          return {
            id: `rsv-${row.id}`,
            kind: 'RESERVATION' as const,
            rawId: row.id,
            reservationId: row.id,
            contractId: row.contractId,
            code: row.contractCode || row.code,
            facilityId: row.facilityId || (id && id > 0 ? id : 0),
            facilityName: row.facilityName || '',
            customerId: row.customerId,
            customerName: cust.name,
            customerPhone: cust.phone,
            customerEmail: cust.email,
            unitTypeId: row.unitTypeId,
            unitTypeName: row.unitTypeName || '',
            startDate: row.startDate,
            rentalMonths: row.rentalMonths,
            endDateExclusive: row.endDateExclusive,
            storageUnitId: isAssigned ? row.storageUnitId : undefined,
            storageUnitCode: isAssigned ? row.storageUnitCode : undefined,
            assignedStaffId: undefined,
            isAssigned,
          };
        });

      // 4. Hợp đồng chờ đổi ô kho do sự cố lúc bàn giao (CONTRACT_RELOCATION)
      const relocationContracts: AllocationQueueItem[] = contracts
        .filter(
          (c) =>
            Boolean(c.relocationEligible) ||
            c.status === 'RELOCATION_PENDING' ||
            c.storageUnitCode === 'Chờ gán lại ô kho'
        )
        .map((c) => ({
          id: `ctr-${c.id}`,
          kind: 'CONTRACT_RELOCATION' as const,
          rawId: c.id,
          contractId: c.id,
          reservationId: c.reservationId,
          code: c.code,
          facilityId: c.facilityId || (id && id > 0 ? id : 0),
          facilityName: c.facilityName || '',
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
          storageUnitCode: c.storageUnitCode,
          originalDefectiveUnitCode: c.storageUnitCode,
          assignedStaffId: c.assignedStaffId,
          assignedStaffName: c.assignedStaffName,
          isAssigned: true,
        }));

      const merged = [...pendingContractAllocations, ...pendingRsv, ...relocationContracts]
        .map((item) => {
          if (!item.facilityName) {
            const fac = facilitiesRef.current.find((f) => f.id === item.facilityId);
            return {
              ...item,
              facilityName: fac ? fac.name : item.facilityId ? `Cơ sở #${item.facilityId}` : '',
            };
          }
          return item;
        })
        .sort((a, b) => {
          // Ưu tiên đơn sự cố lên đầu, sau đó đến đơn chưa gán, rồi sắp xếp theo ngày nhận kho
          if (a.kind === 'CONTRACT_RELOCATION' && b.kind !== 'CONTRACT_RELOCATION') return -1;
          if (b.kind === 'CONTRACT_RELOCATION' && a.kind !== 'CONTRACT_RELOCATION') return 1;
          if (!a.isAssigned && b.isAssigned) return -1;
          if (a.isAssigned && !b.isAssigned) return 1;
          return a.startDate.localeCompare(b.startDate);
        });

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
        setFacilitiesLoading(true);
        const list = await fetchMyAssignedFacilities();
        if (!active) return;
        const assignedList = list || [];
        setFacilities(assignedList);

        if (assignedList.length > 0) {
          const saved = localStorage.getItem('manager_selected_facility_id');
          if (saved === 'ALL') {
            setFacilityId(null);
          } else if (saved && Number(saved) > 0) {
            const targetId = Number(saved);
            const found = assignedList.find((f) => f.id === targetId) ? targetId : assignedList[0].id;
            setFacilityId(found);
          } else {
            // Mặc định nạp cơ sở đầu tiên nếu có
            setFacilityId((prev) => (prev != null && assignedList.some((f) => f.id === prev) ? prev : assignedList[0].id));
          }
        }
        setIsFacilityResolved(true);
      } catch (err) {
        if (!active) return;
        showToast(err instanceof Error ? err.message : 'Không tải được danh mục cơ sở', 'error');
        setIsFacilityResolved(true);
      } finally {
        if (active) setFacilitiesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 2. Khi cơ sở sẵn sàng hoặc thay đổi: Tải hàng đợi cần gán ô và danh sách nhân viên cơ sở
  useEffect(() => {
    if (!isFacilityResolved) return;
    let active = true;
    (async () => {
      try {
        await loadQueue(facilityId);
        if (facilityId != null) {
          await loadStaff(facilityId);
        }
      } catch (err) {
        if (!active) return;
        showToast(err instanceof Error ? err.message : 'Không tải được hàng đợi', 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [facilityId, isFacilityResolved, loadQueue, loadStaff]);

  const selected = activeItem || (queue.find((row) => row.id === selectedId) ?? null);

  const unassignedCount = useMemo(() => queue.filter((x) => !x.isAssigned).length, [queue]);
  const assignedCount = useMemo(() => queue.filter((x) => x.isAssigned).length, [queue]);

  const displayedQueue = useMemo(() => {
    if (filterTab === 'UNASSIGNED') return queue.filter((x) => !x.isAssigned);
    if (filterTab === 'ASSIGNED') return queue.filter((x) => x.isAssigned);
    return queue;
  }, [queue, filterTab]);

  // Mở sơ đồ 2D cho đơn cụ thể
  const handleOpenFloorPlan = (row: AllocationQueueItem) => {
    setSelectedId(row.id);
    setActiveItem(row);
    setIsFloorPlanOpen(true);
  };

  // Mở form xác nhận sau khi chọn ô cụ thể trên sơ đồ 2D
  const openAssignModal = async (unit: StorageUnitResponse) => {
    setModalUnit(unit);
    // Nếu là đổi ô cho hợp đồng/đơn đã gán thì ưu tiên giữ lại nhân viên đã được gán trước đó
    setSelectedStaffId(selected?.assignedStaffId ?? null);
    setStaffError(null);
    const targetFacId = selected?.facilityId || facilityId;
    if (targetFacId) {
      await loadStaff(targetFacId);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selected || !modalUnit || assigningUnitId != null) return;

    if (!selectedStaffId && !selected.assignedStaffId && selected.kind === 'RESERVATION') {
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
      } else if (selected.reservationId) {
        // Gán hoặc đổi ô kho trước ngày nhận theo BR-AVL-04 qua ReservationService
        const targetStaffId = selectedStaffId || selected.assignedStaffId || 1;
        await assignUnit(selected.reservationId, {
          storageUnitId: modalUnit.id,
          staffId: targetStaffId,
          scheduledDate: selected.startDate,
          scheduledStartTime: '08:00',
          scheduledEndTime: '17:00',
        });

        if (selectedStaffId && selected.assignedStaffId && selectedStaffId !== selected.assignedStaffId) {
          try {
            await reassignStaffApi(
              selected.reservationId,
              selectedStaffId,
              'Thay đổi nhân viên tiếp đón'
            );
          } catch {
            // Không chặn nếu cập nhật ca tiếp đón thất bại nhẹ
          }
        }

        if (selected.isAssigned) {
          showToast(`Đã đổi thành công sang ô ${modalUnit.code} cho đơn ${selected.code}!`);
        } else {
          showToast(`Đã gán ô ${modalUnit.code} và phân công nhân viên tiếp đón thành công!`);
        }
      } else if (selected.contractId) {
        // Hợp đồng trực tiếp không có mã đặt chỗ
        await reassignStorageUnit({
          contractId: selected.contractId,
          currentUnitId: selected.storageUnitId || 0,
          newUnitId: modalUnit.id,
          newUnitCode: modalUnit.code,
          reason: selected.isAssigned
            ? 'Quản lý cơ sở điều chuyển đổi ô kho trước ngày nhận'
            : 'Phân bổ ô kho ban đầu cho hợp đồng trực tiếp',
          customerConsent: true,
        });

        if (selected.isAssigned) {
          showToast(`Đã đổi thành công sang ô ${modalUnit.code} cho hợp đồng ${selected.code}!`);
        } else {
          showToast(`Đã gán ô ${modalUnit.code} cho hợp đồng thành công!`);
        }
      }

      setModalUnit(null);
      await loadQueue(facilityId, true);
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
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {facilitiesLoading ? (
            <div className="h-9 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs sm:text-sm font-semibold text-slate-400 flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>Đang tải cơ sở...</span>
            </div>
          ) : facilities.length > 0 ? (
            <select
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white shadow-2xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              value={facilityId ?? 'ALL'}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? null : Number(e.target.value);
                setFacilityId(val);
                localStorage.setItem('manager_selected_facility_id', val != null ? String(val) : 'ALL');
              }}
            >
              <option value="ALL">🏢 Tất cả cơ sở quản lý</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name}
                </option>
              ))}
            </select>
          ) : null}

          <button
            type="button"
            onClick={() => loadQueue(facilityId, true)}
            disabled={refreshing || loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Danh sách nhiệm vụ gán ô kho từ trên xuống (Full-width Vertical Task List) */}
      <section className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-sm text-slate-800">
              Danh sách đơn chờ tiếp đón & gán ô
            </span>
            {/* Bộ lọc phân loại đơn */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({queue.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('UNASSIGNED')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterTab === 'UNASSIGNED'
                    ? 'bg-white text-amber-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Chưa gán ô ({unassignedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('ASSIGNED')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filterTab === 'ASSIGNED'
                    ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đã gán ô (Có thể đổi) ({assignedCount})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/90 text-slate-600 text-xs font-semibold border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 w-[28%]">Mã đơn & Khách hàng</th>
                <th className="px-4 py-3 w-[24%]">Hạng kho khách đặt</th>
                <th className="px-4 py-3 w-[20%]">Ngày nhận kho</th>
                <th className="px-4 py-3 w-[16%]">Trạng thái</th>
                <th className="px-4 py-3 w-[12%] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-slate-500 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand-600" />
                      <span className="text-xs font-medium">Đang tải danh sách nhiệm vụ gán ô...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">
                        {filterTab === 'UNASSIGNED'
                          ? 'Không có đơn nào chưa gán ô'
                          : filterTab === 'ASSIGNED'
                          ? 'Chưa có đơn nào đã gán ô'
                          : 'Không có đơn nào chờ gán ô'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {filterTab === 'UNASSIGNED'
                          ? 'Toàn bộ đơn trong danh sách hiện đã được phân bổ ô kho sẵn sàng.'
                          : facilityId == null
                          ? 'Toàn bộ đơn đặt chỗ trên các cơ sở quản lý đã được phân bổ ô kho và chỉ định nhân viên hoàn tất.'
                          : `Toàn bộ đơn đặt chỗ tại cơ sở ${selectedFacility?.name} đã được phân bổ ô kho và chỉ định nhân viên hoàn tất.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedQueue.map((row) => {
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
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-0.5">
                            <Building2 className="w-3 h-3 text-brand-600 shrink-0" />
                            <span>{row.facilityName || `Cơ sở #${row.facilityId}`}</span>
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
                        <div
                          className="flex items-center gap-1.5 font-medium text-slate-800"
                          title={row.rentalMonths ? `Thời hạn thuê: ${row.rentalMonths} tháng` : undefined}
                        >
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

                      {/* Cột 4: Trạng thái */}
                      <td className="px-4 py-3.5">
                        {row.kind === 'CONTRACT_RELOCATION' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                            Gán lại ô kho
                          </span>
                        ) : row.isAssigned ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ô: {row.storageUnitCode || `ID ${row.storageUnitId}`}
                            </span>
                            {row.assignedStaffName && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                NV: {row.assignedStaffName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="warning">Chờ gán ô</Badge>
                        )}
                      </td>

                      {/* Cột 5: Nút hành động mở Sơ đồ 2D */}
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenFloorPlan(row)}
                          className={`inline-flex items-center justify-center w-[108px] gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer ${
                            row.kind === 'CONTRACT_RELOCATION'
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : row.isAssigned
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-brand-600 hover:bg-brand-700 text-white'
                          }`}
                        >
                          {row.isAssigned ? (
                            <RefreshCw className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-white" />
                          )}
                          <span>{row.kind === 'CONTRACT_RELOCATION' || row.isAssigned ? 'Đổi ô kho' : 'Gán ô kho'}</span>
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
      {isFloorPlanOpen && selected && (
        <FacilityFloorPlanMapModal
          isOpen={isFloorPlanOpen}
          onClose={() => setIsFloorPlanOpen(false)}
          facilityId={selected.facilityId || facilityId || facilities[0]?.id || 1}
          facilityName={selected.facilityName || selectedFacility?.name}
          allowedUnitTypeId={selected.unitTypeId}
          highlightUnitId={selected.storageUnitId}
          targetUnitTypeName={cleanUnitTypeName(selected.unitTypeName)}
          onSelectUnit={(unit) => {
            setIsFloorPlanOpen(false);
            openAssignModal(unit);
          }}
        />
      )}

      {/* Form Modal xác nhận gán ô kho & Chỉ định nhân viên tiếp đón */}
      {modalUnit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl sm:max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header (luôn cố định phía trên, không bị tràn màn hình) */}
            <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-brand-50 text-brand-700 rounded-xl border border-brand-200/80 shrink-0">
                  <MapPin className="w-5 h-5 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                    {selected.kind === 'CONTRACT_RELOCATION'
                      ? 'Xác nhận phân bổ lại ô kho (Đổi ô sự cố)'
                      : selected.isAssigned
                      ? 'Xác nhận đổi ô kho trước ngày nhận'
                      : 'Xác nhận phân bổ ô kho'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {selected.kind === 'CONTRACT_RELOCATION'
                      ? 'Chỉ định ô vật lý mới trên sơ đồ 2D để nhân viên tiếp tục bàn giao cho khách'
                      : selected.isAssigned
                      ? 'Đổi sang ô kho khả dụng khác theo BR-AVL-04. Ô cũ sẽ tự động trở về trạng thái Khả dụng.'
                      : 'Chỉ định ô vật lý và phân công nhân viên cơ sở phụ trách tiếp đón'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalUnit(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (cho phép cuộn độc lập mượt mà nếu màn hình thấp, không bao giờ che mất nút bấm) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-sm">
              {/* Thông tin khách hàng */}
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100/90 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>Thông tin khách hàng</span>
                  </span>
                  <strong className="text-slate-900 text-sm font-semibold">
                    {selected.customerName}
                  </strong>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-700 flex-wrap">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selected.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{selected.customerEmail}</span>
                  </div>
                </div>
              </div>

              {/* Thẻ tóm tắt thông tin đơn và ô được chọn (Grid 2 cột rõ ràng, chống co vỡ chữ) */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-stretch">
                {/* Cột 1: Thông tin đơn / hợp đồng gốc */}
                <div className="flex flex-col justify-between space-y-1.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {selected.kind === 'CONTRACT_RELOCATION' ? 'Hợp đồng cần đổi ô' : 'Đơn đặt chỗ'} / Hạng kho
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap shadow-2xs">
                        {selected.code}
                      </span>
                      <span className="text-xs text-slate-700 font-semibold">
                        {cleanUnitTypeName(selected.unitTypeName)}
                      </span>
                    </div>
                  </div>
                  {selected.isAssigned && selected.storageUnitCode && (
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      Ô đang gán hiện tại: <strong className="text-slate-800 font-mono">{selected.storageUnitCode}</strong>
                    </div>
                  )}
                </div>

                {/* Cột 2: Ô kho mới được chọn */}
                <div className="sm:border-l sm:border-slate-200 sm:pl-3.5 flex flex-col justify-between space-y-1.5">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      {selected.isAssigned ? 'Ô kho mới được chọn' : 'Ô kho được chọn'}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-brand-700 text-sm bg-brand-50 px-2.5 py-1 rounded-lg border border-brand-200 whitespace-nowrap shadow-2xs">
                        {modalUnit.code}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                        Tầng {modalUnit.floor}
                      </span>
                    </div>
                  </div>
                  {modalUnit.unitTypeId !== selected.unitTypeId && (
                    <div className="pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-300">
                        <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Nâng hạng ({modalUnit.unitTypeName || 'Size lớn hơn'})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Thông báo chính sách đền bù nếu nâng hạng */}
              {modalUnit.unitTypeId !== selected.unitTypeId && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Chính sách Đền bù Nâng hạng:</strong> Khách hàng được nâng cấp sang ô kho kích thước lớn hơn mà <u>không phải trả thêm bất kỳ khoản phí chênh lệch nào</u>. Đơn giá và tiền cọc được hệ thống bảo lưu nguyên vẹn theo hợp đồng ban đầu.
                  </div>
                </div>
              )}

              {/* Ngày hẹn nhận kho / bắt đầu hợp đồng */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-bold text-slate-700">
                    {selected.kind === 'CONTRACT_RELOCATION' ? 'Ngày bắt đầu hợp đồng:' : 'Ngày hẹn nhận kho:'}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatDate(selected.startDate)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium shrink-0">
                  {selected.kind === 'CONTRACT_RELOCATION' ? '(Thời hạn thuê được bảo lưu)' : '(Theo ngày khách đặt chỗ nhận kho)'}
                </span>
              </div>

              {/* Dropdown nhân viên tiếp đón */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-600" />
                    <span>Nhân viên cơ sở tiếp đón khách {selected.kind === 'RESERVATION' && !selected.isAssigned && <span className="text-rose-600">*</span>}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {selected.isAssigned ? 'Tùy chọn (đã có NV phụ trách)' : selected.kind === 'RESERVATION' ? 'Bắt buộc' : 'Tùy chọn'}
                  </span>
                </label>

                <select
                  aria-label="Chọn nhân viên tiếp đón"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 cursor-pointer font-medium transition-all ${
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
                  <option value="">-- {selected.kind === 'CONTRACT_RELOCATION' || selected.isAssigned ? 'Giữ nguyên nhân viên hiện tại hoặc chỉ định mới' : 'Chọn nhân viên tiếp đón (Bắt buộc)'} --</option>
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
                  <p className="text-[11px] text-slate-500 mt-1">
                    💡 <em>Lưu ý: {selected.kind === 'CONTRACT_RELOCATION' || selected.isAssigned ? 'Sau khi đổi ô kho mới thành công, nhân viên tại quầy sẽ thấy ô mới và tiến hành bàn giao ngay.' : 'Bắt buộc chọn nhân viên phụ trách nhận kho để hệ thống tạo lịch trực.'}</em>
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer (luôn cố định dưới cùng, không bao giờ bị che khuất) */}
            <div className="shrink-0 px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/80">
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
                disabled={assigningUnitId != null || (!selectedStaffId && !selected.assignedStaffId && selected.kind === 'RESERVATION')}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm disabled:opacity-50 transition-all cursor-pointer ${
                  selected.kind === 'CONTRACT_RELOCATION'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : selected.isAssigned
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
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
                ) : selected.isAssigned ? (
                  <span>Xác nhận đổi sang ô {modalUnit.code}</span>
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
