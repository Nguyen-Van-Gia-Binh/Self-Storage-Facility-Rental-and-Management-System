import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Building2,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercent } from '@/utils/format';
import { useScrollLock } from '@/hooks/useScrollLock';

export interface FacilityPerformanceData {
  facilityId: number;
  facilityName: string;
  rentalRevenue: number;
  surchargeRevenue: number;
  renewalRevenue: number;
  overdueFeeRevenue: number;
  totalRevenue: number;
  depositBalance: number;
  refundAmount: number;
  occupancyRate: number;
  occupiedUnits: number;
  availableUnits: number;
  outOfServiceUnits: number;
  totalUnits: number;
  overdueCount: number;
}

export interface FacilityPerformanceDrawerProps {
  isOpen: boolean;
  facility: FacilityPerformanceData | null;
  onClose: () => void;
  onApplyGlobalFilter: (facilityId: number) => void;
}

export const FacilityPerformanceDrawer: React.FC<FacilityPerformanceDrawerProps> = ({
  isOpen,
  facility,
  onClose,
  onApplyGlobalFilter,
}) => {
  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !facility) return null;

  const exploitable = Math.max(0, facility.totalUnits - facility.outOfServiceUnits);
  const rateUnknown = exploitable === 0;

  const streams = [
    {
      label: 'Tiền thuê kho',
      amount: facility.rentalRevenue,
      color: 'bg-emerald-500',
    },
    {
      label: 'Phí gia hạn',
      amount: facility.renewalRevenue,
      color: 'bg-indigo-500',
    },
    {
      label: 'Phụ phí dịch vụ',
      amount: facility.surchargeRevenue,
      color: 'bg-amber-500',
    },
    {
      label: 'Phí phạt quá hạn',
      amount: facility.overdueFeeRevenue,
      color: 'bg-rose-500',
    },
    {
      label: 'Ký quỹ / cọc giữ chỗ',
      amount: facility.depositBalance,
      color: 'bg-sky-500',
    },
  ];

  const totalStreamSum = streams.reduce((sum, s) => sum + s.amount, 0);

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden no-print" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="fixed inset-y-0 right-0 h-full w-full sm:max-w-md bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Header Drawer */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-brand-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight line-clamp-1">
                  {facility.facilityName}
                </h2>
                <div className="text-xs text-slate-300 font-mono mt-0.5">
                  Mã chi nhánh: #{facility.facilityId}
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

          {/* Body nội dung có thể cuộn */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 1. Chỉ số tóm tắt nhanh (4 Cards) */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Chỉ số hiệu suất vận hành
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500">Tổng thực thu</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {formatCurrency(facility.totalRevenue)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500">Tỷ lệ lấp đầy</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    {rateUnknown ? 'Không xác định' : formatPercent(facility.occupancyRate)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500">Ô trống / Khai thác</div>
                  <div className="text-base font-bold font-mono text-slate-900 mt-1">
                    <span className="text-emerald-600">{facility.availableUnits}</span> /{' '}
                    <span>{exploitable}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500">HĐ nợ quá hạn</div>
                  <div className="text-base font-bold font-mono mt-1">
                    {facility.overdueCount > 0 ? (
                      <span className="text-rose-600">{facility.overdueCount} HĐ</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">0 HĐ</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Bóc tách chi tiết nguồn thu của cơ sở */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Bóc tách nguồn thu cơ sở
              </h3>
              <div className="space-y-2 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                {streams.map((s, idx) => {
                  const percent = totalStreamSum > 0 ? (s.amount / totalStreamSum) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${s.color}`} />
                        <span className="text-slate-700 font-medium">{s.label}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="font-bold text-slate-900 mr-2">
                          {formatCurrency(s.amount)}
                        </span>
                        <span className="text-slate-400 text-[11px]">({percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}

                {/* Hoàn tiền của cơ sở */}
                {facility.refundAmount > 0 && (
                  <div className="pt-2 mt-1 border-t border-slate-200/60 flex items-center justify-between text-xs text-amber-800">
                    <span className="font-semibold">Đã hoàn trả khách:</span>
                    <span className="font-mono font-bold text-rose-600">
                      - {formatCurrency(facility.refundAmount)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Phân bổ ô kho theo trạng thái vật lý */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Hiện trạng ô kho ({facility.totalUnits} ô tổng)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    <span>Ô còn trống sẵn sàng đón khách:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-900 text-sm">
                    {facility.availableUnits} ô
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-800">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Ô đang có khách thuê hoạt động:</span>
                  </div>
                  <span className="font-mono font-bold text-sky-900 text-sm">
                    {facility.occupiedUnits} ô
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Wrench className="w-4 h-4 text-slate-500" />
                    <span>Bảo trì / Ngừng khai thác:</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {facility.outOfServiceUnits} ô
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Drawer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onApplyGlobalFilter(facility.facilityId);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs bg-brand-500 hover:bg-brand-600 text-white"
            >
              <span>Xem báo cáo toàn diện cơ sở này</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </aside>
      </div>,
    document.body
  );
};
