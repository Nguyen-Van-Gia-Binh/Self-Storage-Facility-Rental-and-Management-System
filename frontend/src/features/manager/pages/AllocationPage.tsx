import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Calendar, Check, Clock, User, X } from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { assignUnit, listReservations, type ReservationResponse } from '@/api/reservation';
import { fetchStorageUnits } from '@/api/unit';
import { getStaffWorkload } from '@/features/manager/api/staffAssignmentApi';
import type { StaffWorkloadItem } from '@/features/manager/types/staffAssignment';
import { Badge } from '@/components/ui/Badge';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse, UnitStatus } from '@/types/unit';

const ASSIGNABLE: UnitStatus[] = ['AVAILABLE'];

const QUICK_SLOTS = [
  { label: '08:00 - 09:00', start: '08:00', end: '09:00' },
  { label: '09:00 - 10:00', start: '09:00', end: '10:00' },
  { label: '10:00 - 11:00', start: '10:00', end: '11:00' },
  { label: '14:00 - 15:00', start: '14:00', end: '15:00' },
  { label: '15:00 - 16:00', start: '15:00', end: '16:00' },
  { label: '16:00 - 17:00', start: '16:00', end: '17:00' },
];

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${isoDate}T00:00:00`);
  return Math.round((start.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function statusVariant(status: string): 'available' | 'reserved' | 'occupied' | 'default' {
  if (status === 'AVAILABLE') return 'available';
  if (status === 'RESERVED') return 'reserved';
  if (status === 'OCCUPIED') return 'occupied';
  return 'default';
}

function statusLabel(status: string): string {
  if (status === 'AVAILABLE') return 'Trống';
  if (status === 'RESERVED') return 'Đã giữ';
  if (status === 'OCCUPIED') return 'Đang thuê';
  return status;
}

export const AllocationPage: React.FC = () => {
  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [facilityId, setFacilityId] = useState<number | null>(null);
  const [queue, setQueue] = useState<ReservationResponse[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [units, setUnits] = useState<StorageUnitResponse[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffWorkloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [assigningUnitId, setAssigningUnitId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for 3-in-1 Assignment
  const [modalUnit, setModalUnit] = useState<StorageUnitResponse | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledStartTime, setScheduledStartTime] = useState<string>('09:00');
  const [scheduledEndTime, setScheduledEndTime] = useState<string>('10:00');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadQueue = useCallback(async (id: number) => {
    const rows = await listReservations({ status: 'CONFIRMED', facilityId: id, size: 100 });
    const pending = rows
      .filter((row) => row.storageUnitId == null)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    setQueue(pending);
    setSelectedId((current) => {
      if (current != null && pending.some((row) => row.id === current)) return current;
      return pending[0]?.id ?? null;
    });
    return pending;
  }, []);

  const loadUnits = useCallback(async (id: number, unitTypeId: number) => {
    const page = await fetchStorageUnits(id, { unitTypeId, size: 200 });
    setUnits(page?.content || []);
  }, []);

  const loadStaff = useCallback(async (id: number) => {
    try {
      const list = await getStaffWorkload(id);
      setStaffMembers(list);
    } catch {
      setStaffMembers([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchMyAssignedFacilities();
        if (!active) return;
        setFacilities(list);
        setFacilityId(list[0]?.id ?? null);
      } catch (err) {
        if (!active) return;
        showToast(err instanceof Error ? err.message : 'Không tải được cơ sở', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

  const selected = queue.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    if (facilityId == null || selected == null) {
      setUnits([]);
      return;
    }
    let active = true;
    setUnitsLoading(true);
    (async () => {
      try {
        await loadUnits(facilityId, selected.unitTypeId);
      } catch (err) {
        if (!active) return;
        setUnits([]);
        showToast(err instanceof Error ? err.message : 'Không tải được ô kho', 'error');
      } finally {
        if (active) setUnitsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [facilityId, selected, loadUnits]);

  const openAssignModal = (unit: StorageUnitResponse) => {
    if (!selected) return;
    setModalUnit(unit);
    setScheduledDate(selected.startDate || new Date().toISOString().slice(0, 10));
    setScheduledStartTime('09:00');
    setScheduledEndTime('10:00');
    setSelectedStaffId(staffMembers[0]?.staffId ?? null);
  };

  const handleConfirmAssignment = async () => {
    if (!selected || !modalUnit || assigningUnitId != null) return;
    if (!selectedStaffId) {
      showToast('Vui lòng chọn nhân viên trực tiếp đón khách', 'error');
      return;
    }
    setAssigningUnitId(modalUnit.id);
    try {
      await assignUnit(selected.id, {
        storageUnitId: modalUnit.id,
        staffId: selectedStaffId,
        scheduledDate,
        scheduledStartTime,
        scheduledEndTime,
      });
      showToast(`Đã gán ô ${modalUnit.code} và lên lịch đón tiếp thành công!`);
      setModalUnit(null);
      if (facilityId != null) {
        const pending = await loadQueue(facilityId);
        const next = pending.find((row) => row.id === selected.id) ?? pending[0];
        if (next) await loadUnits(facilityId, next.unitTypeId);
        else setUnits([]);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gán ô thất bại', 'error');
    } finally {
      setAssigningUnitId(null);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
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

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Phân bổ ô kho & Lên lịch tiếp đón</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gán ô kho vật lý, chỉ định nhân viên trực và chốt giờ hẹn bàn giao cho khách
          </p>
        </div>
        {facilities.length > 1 && (
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm font-medium"
            value={facilityId ?? ''}
            onChange={(event) => setFacilityId(Number(event.target.value))}
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Table 1: Pending Queue */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-semibold text-sm text-slate-800">
              Danh sách chờ phân bổ ({queue.length})
            </span>
            <span className="text-xs text-slate-500">Late-binding JIT Allocation</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-medium">Đơn</th>
                <th className="px-3 py-2 font-medium">Hạng kho</th>
                <th className="px-3 py-2 font-medium">Ngày nhận</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-500 text-center">
                    Đang tải...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-600 text-center">
                    Không có đơn nào cần gán ô
                  </td>
                </tr>
              ) : (
                queue.map((row) => {
                  const urgent = daysUntil(row.startDate) < 3;
                  const isSelected = row.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50 border-teal-300 font-medium' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-3 py-2 font-mono text-slate-900">{row.code}</td>
                      <td className="px-3 py-2">{row.unitTypeName || row.unitTypeId}</td>
                      <td className={`px-3 py-2 ${urgent ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>
                        {formatDate(row.startDate)}
                        {urgent && <span className="ml-1 text-[10px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded">Gấp</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="warning">Chờ gán ô</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        {/* Table 2: Available Units */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="font-semibold text-sm text-slate-800">
              Ô kho phù hợp hạng kho ({units.filter((u) => ASSIGNABLE.includes(u.status)).length} ô trống)
            </span>
            {selected && (
              <span className="text-xs text-teal-700 font-medium">
                Đang chọn: {selected.code}
              </span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 font-medium">Ô kho</th>
                <th className="px-3 py-2 font-medium">Tầng</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {unitsLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-500 text-center">
                    Đang tải danh sách ô kho...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-600 text-center">
                    Không có ô kho nào phù hợp
                  </td>
                </tr>
              ) : (
                units.map((unit) => {
                  const clickable = ASSIGNABLE.includes(unit.status) && selected != null;
                  return (
                    <tr key={unit.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                      <td className="px-3 py-2 font-mono font-semibold text-slate-900">{unit.code}</td>
                      <td className="px-3 py-2 text-slate-600">Tầng {unit.floor}</td>
                      <td className="px-3 py-2">
                        <Badge variant={statusVariant(unit.status)}>{statusLabel(unit.status)}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {clickable && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                            onClick={() => openAssignModal(unit)}
                          >
                            Phân bổ & Hẹn giờ
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>

      {/* 3-in-1 Assignment & Appointment Modal */}
      {modalUnit && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Phân bổ ô kho & Lên lịch tiếp đón</h3>
                  <p className="text-xs text-slate-500">Chốt lịch và giao quyền tiếp đón cho nhân viên cơ sở</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalUnit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm">
              {/* Summary banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Đơn đặt / Hạng kho</div>
                  <div className="font-bold text-slate-900">{selected.code} • {selected.unitTypeName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Ô kho được chọn</div>
                  <div className="font-mono font-bold text-teal-700 text-base">{modalUnit.code} (Tầng {modalUnit.floor})</div>
                </div>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Ngày hẹn nhận kho
                </label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Khung giờ đón tiếp khách
                </label>
                {/* Quick slot pills */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {QUICK_SLOTS.map((slot) => {
                    const isSelected = scheduledStartTime === slot.start && scheduledEndTime === slot.end;
                    return (
                      <button
                        key={slot.label}
                        type="button"
                        onClick={() => {
                          setScheduledStartTime(slot.start);
                          setScheduledEndTime(slot.end);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-center transition-all ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold shadow-sm'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={scheduledStartTime}
                    onChange={(e) => setScheduledStartTime(e.target.value)}
                  />
                  <span className="text-slate-400 text-xs">đến</span>
                  <input
                    type="time"
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={scheduledEndTime}
                    onChange={(e) => setScheduledEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Nhân viên cơ sở phụ trách tiếp đón
                </label>
                {staffMembers.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
                    Chưa có nhân viên nào trong cơ sở này. Vui lòng phân công ca trực trước.
                  </div>
                ) : (
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    value={selectedStaffId ?? ''}
                    onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                  >
                    {staffMembers.map((staff) => (
                      <option key={staff.staffId} value={staff.staffId}>
                        {staff.staffName} ({staff.activeTaskCount} việc đang xử lý)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setModalUnit(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-sm font-semibold transition-colors"
                disabled={assigningUnitId != null}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                disabled={assigningUnitId != null || !selectedStaffId}
                className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all cursor-pointer"
              >
                {assigningUnitId != null ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Xác nhận phân bổ & Lên lịch'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};