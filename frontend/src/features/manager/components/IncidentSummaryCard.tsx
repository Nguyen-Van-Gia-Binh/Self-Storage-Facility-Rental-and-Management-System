// frontend/src/features/manager/components/IncidentSummaryCard.tsx
import React from 'react';
import { Building2, MapPin, ArrowRight, Clock, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export interface IncidentFacilityStats {
  facilityId: number;
  facilityCode: string;
  facilityName: string;
  address?: string;
  city?: string;
  total: number;
  pendingCount: number; // NEW, OPEN
  inProgressCount: number; // ASSIGNED, IN_PROGRESS
  resolvedCount: number; // RESOLVED, CLOSED
  cancelledCount: number; // CANCELLED
}

interface IncidentSummaryCardProps {
  data: IncidentFacilityStats;
  onSelect: (facilityId: number) => void;
}

export const IncidentSummaryCard: React.FC<IncidentSummaryCardProps> = ({ data, onSelect }) => {
  const {
    facilityId,
    facilityCode,
    facilityName,
    address,
    city,
    total,
    pendingCount,
    inProgressCount,
    resolvedCount,
    cancelledCount,
  } = data;

  const resolvedPercent = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <div
      onClick={() => onSelect(facilityId)}
      className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-brand-500/50 transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between overflow-hidden"
    >
      {/* Thanh màu chỉ báo tỷ lệ hoàn thành ở trên cùng */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${resolvedPercent}%` }}
        />
      </div>

      <div>
        {/* Header: Icon, Tên cơ sở & Mã */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {facilityCode}
                </span>
                {city && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {city}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base line-clamp-1 mt-0.5">
                {facilityName}
              </h3>
            </div>
          </div>
        </div>

        {/* Địa chỉ */}
        {address && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{address}</span>
          </div>
        )}

        {/* Tổng số sự cố */}
        <div className="bg-slate-50/80 rounded-xl p-3 mb-3 border border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-600 font-medium">Tổng số sự cố</span>
          <span className="text-base font-bold text-slate-900">
            {total} <span className="text-xs font-normal text-slate-500">ticket</span>
          </span>
        </div>

        {/* Mini stats 4 ô trạng thái */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100/80">
            <div className="flex items-center gap-1.5 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ nhận:</span>
            </div>
            <span className="font-bold text-amber-900">{pendingCount}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50/60 border border-orange-100/80">
            <div className="flex items-center gap-1.5 text-orange-700">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Đang xử lý:</span>
            </div>
            <span className="font-bold text-orange-900">{inProgressCount}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-100/80">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã xử lý:</span>
            </div>
            <span className="font-bold text-emerald-900">{resolvedCount}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100/60 border border-slate-200/60">
            <div className="flex items-center gap-1.5 text-slate-600">
              <XCircle className="w-3.5 h-3.5" />
              <span>Đã hủy:</span>
            </div>
            <span className="font-bold text-slate-800">{cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
        <span>Xem danh sách sự cố</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};
