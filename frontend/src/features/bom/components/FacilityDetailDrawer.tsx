import React from 'react';
import {
  X,
  Building2,
  Phone,
  MapPin,
  Clock,
  Edit,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { FacilityListItem } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface FacilityDetailDrawerProps {
  facility: FacilityListItem | null;
  onClose: () => void;
  onEdit: (facility: FacilityListItem) => void;
}

export const FacilityDetailDrawer: React.FC<FacilityDetailDrawerProps> = ({
  facility,
  onClose,
  onEdit,
}) => {
  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden no-print" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-brand-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight line-clamp-1">{facility.name}</h2>
                <div className="text-xs text-slate-300 font-mono mt-0.5">
                  Mã cơ sở: #{facility.code}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Đóng bảng chi tiết"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Trạng thái hoạt động */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <span className="text-xs font-semibold text-slate-600">Trạng thái vận hành:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  facility.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {facility.isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đang hoạt động</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tạm ngưng</span>
                  </>
                )}
              </span>
            </div>

            {/* Thông tin liên hệ & địa chỉ */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thông tin cơ sở
              </h3>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 font-medium">Địa chỉ cơ sở:</div>
                    <div className="text-slate-800 font-semibold mt-0.5">{facility.address}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 font-medium">Đường dây nóng:</div>
                    <div className="text-slate-800 font-mono font-semibold mt-0.5">
                      {facility.phone}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-white flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-400 font-medium">Giờ mở cửa:</div>
                    <div className="text-slate-800 font-medium mt-0.5">{facility.openingHours}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Giá khởi điểm & Loại ô kho */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="text-slate-500 font-medium">Giá thuê từ:</div>
                <div className="text-base font-bold font-mono text-brand-600 mt-1">
                  {facility.lowestMonthlyPrice ? formatCurrency(facility.lowestMonthlyPrice) : 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="text-slate-500 font-medium">Số loại ô kho:</div>
                <div className="text-base font-bold font-mono text-slate-800 mt-1">
                  {facility.activeUnitTypeCount ?? 0} loại
                </div>
              </div>
            </div>

            {/* Mô tả cơ sở */}
            {facility.description && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  Giới thiệu & Tiện ích:
                </span>
                <p className="text-slate-600 leading-relaxed p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {facility.description}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onEdit(facility)}
              className="flex items-center gap-1.5 text-xs bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Chỉnh sửa cơ sở</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
