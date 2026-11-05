import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { fetchMyAssignedFacilities } from '@/api/facility';
import { assignUnit, listReservations, type ReservationResponse } from '@/api/reservation';
import { fetchStorageUnits } from '@/api/unit';
import { Badge } from '@/components/ui/Badge';
import type { FacilityListItem } from '@/types';
import type { StorageUnitResponse, UnitStatus } from '@/types/unit';

const ASSIGNABLE: UnitStatus[] = ['AVAILABLE'];

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
  const [loading, setLoading] = useState(true);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [assigningUnitId, setAssigningUnitId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      } catch (err) {
        if (!active) return;
        showToast(err instanceof Error ? err.message : 'Không tải được hàng đợi', 'error');
      }
    })();
    return () => {
      active = false;
    };
  }, [facilityId, loadQueue]);

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

  const handleAssign = async (unit: StorageUnitResponse) => {
    if (!selected || assigningUnitId != null) return;
    if (!ASSIGNABLE.includes(unit.status)) return;
    setAssigningUnitId(unit.id);
    try {
      await assignUnit(selected.id, unit.id);
      showToast('Gán ô thành công');
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
        <h1 className="text-lg font-bold text-slate-900">Gán ô kho</h1>
        {facilities.length > 1 && (
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
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
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
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
                  <td colSpan={4} className="px-3 py-6 text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : queue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-600">
                    Không có đơn nào cần gán ô
                  </td>
                </tr>
              ) : (
                queue.map((row) => {
                  const urgent = daysUntil(row.startDate) < 3;
                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-slate-100 cursor-pointer ${
                        row.id === selectedId ? 'bg-slate-50' : ''
                      }`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <td className="px-3 py-2 font-mono">{row.code}</td>
                      <td className="px-3 py-2">{row.unitTypeName || row.unitTypeId}</td>
                      <td className={`px-3 py-2 ${urgent ? 'text-red-600' : ''}`}>
                        {formatDate(row.startDate)}
                      </td>
                      <td className="px-3 py-2">{row.status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Ô kho</th>
                <th className="px-3 py-2 font-medium">Tầng</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {unitsLoading ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-slate-600">
                    Không có ô kho nào phù hợp
                  </td>
                </tr>
              ) : (
                units.map((unit) => {
                  const clickable = ASSIGNABLE.includes(unit.status) && selected != null;
                  const spinning = assigningUnitId === unit.id;
                  return (
                    <tr key={unit.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono">{unit.code}</td>
                      <td className="px-3 py-2">{unit.floor}</td>
                      <td className="px-3 py-2">
                        <Badge variant={statusVariant(unit.status)}>{statusLabel(unit.status)}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {clickable && (
                          <button
                            type="button"
                            className="text-sm font-semibold text-slate-900 disabled:opacity-50"
                            disabled={assigningUnitId != null}
                            onClick={() => handleAssign(unit)}
                          >
                            {spinning ? (
                              <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                            ) : (
                              'Gán'
                            )}
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
    </div>
  );
};
