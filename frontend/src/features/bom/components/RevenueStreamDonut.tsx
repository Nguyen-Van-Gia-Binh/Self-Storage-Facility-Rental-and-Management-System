import React, { useState } from 'react';
import { PieChart, RotateCcw } from 'lucide-react';
import type { SystemRevenueReport } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface RevenueStreamDonutProps {
  revenue?: SystemRevenueReport;
  selectedStream?: string | null;
  onSelectStream?: (streamId: string | null) => void;
  isLoading?: boolean;
}

interface StreamItem {
  id: string;
  label: string;
  shortLabel: string;
  amount: number;
  hexColor: string;
  twBg: string;
  twText: string;
  desc: string;
}

export const RevenueStreamDonut: React.FC<RevenueStreamDonutProps> = ({
  revenue,
  selectedStream = null,
  onSelectStream,
  isLoading = false,
}) => {
  const [hoveredStreamId, setHoveredStreamId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-5 space-y-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 w-44 h-44 bg-gray-100 rounded-full mx-auto" />
          <div className="md:col-span-8 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const rental = revenue?.rentalRevenue ?? 0;
  const deposit = revenue?.depositBalance ?? 0;
  const surcharge = revenue?.surchargeRevenue ?? 0;
  const renewal = revenue?.renewalRevenue ?? 0;
  const overdue = revenue?.overdueFeeRevenue ?? 0;
  const refund = revenue?.totalRefundAmount ?? 0;
  const total = revenue?.totalRevenue ?? 0;

  const streamSum = rental + deposit + surcharge + renewal + overdue;

  const streams: StreamItem[] = [
    {
      id: 'rental',
      label: 'Tiền thuê kho',
      shortLabel: 'Tiền thuê',
      amount: rental,
      hexColor: '#16a34a',
      twBg: 'bg-emerald-600',
      twText: 'text-gray-900',
      desc: 'Dòng tiền hợp đồng cốt lõi theo tháng/kỳ',
    },
    {
      id: 'renewal',
      label: 'Phí gia hạn',
      shortLabel: 'Gia hạn',
      amount: renewal,
      hexColor: '#334155',
      twBg: 'bg-slate-700',
      twText: 'text-slate-700',
      desc: 'Hợp đồng tái tục kỳ mới của khách quen',
    },
    {
      id: 'deposit',
      label: 'Cọc giữ chỗ & đảm bảo',
      shortLabel: 'Tiền cọc',
      amount: deposit,
      hexColor: '#94a3b8',
      twBg: 'bg-slate-400',
      twText: 'text-slate-600',
      desc: 'Khoản ký quỹ đảm bảo thực hiện hợp đồng',
    },
    {
      id: 'surcharge',
      label: 'Phụ phí dịch vụ',
      shortLabel: 'Phụ phí',
      amount: surcharge,
      hexColor: '#cbd5e1',
      twBg: 'bg-slate-300',
      twText: 'text-slate-600',
      desc: 'Bốc dỡ, điện lạnh, xe nâng, vật tư đóng gói',
    },
    {
      id: 'overdue',
      label: 'Phí phạt quá hạn',
      shortLabel: 'Phí quá hạn',
      amount: overdue,
      hexColor: '#e11d48',
      twBg: 'bg-rose-600',
      twText: 'text-rose-700',
      desc: 'Khoản phạt trễ hạn thanh toán hợp đồng',
    },
  ];

  // Compact SVG Donut Chart (no fake gray background ring)
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 22;
  const center = 90;

  let accumulatedPercent = 0;
  const segments = streams.map((s) => {
    const percent = streamSum > 0 ? s.amount / streamSum : 0;
    const dashLength = percent * circumference;
    const strokeDashoffset = -(accumulatedPercent * circumference);
    accumulatedPercent += percent;
    return {
      ...s,
      percent,
      dashLength,
      strokeDashoffset,
    };
  });

  const activeStreamId = hoveredStreamId || selectedStream;
  const activeStream = activeStreamId ? streams.find((s) => s.id === activeStreamId) : null;
  const activePercent = activeStream && streamSum > 0 ? (activeStream.amount / streamSum) * 100 : null;

  const netRevenue = Math.max(0, total - refund);
  const refundDisplay = refund > 0 ? `- ${formatCurrency(refund)}` : formatCurrency(0);
  const netDisplay = formatCurrency(netRevenue);

  const handleStreamClick = (streamId: string) => {
    if (!onSelectStream) return;
    if (selectedStream === streamId) {
      onSelectStream(null);
    } else {
      onSelectStream(streamId);
    }
  };

  return (
    <div className="bg-white rounded-md border border-gray-200 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <PieChart className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Cơ Cấu Nguồn Thu &amp; Dòng Tiền Toàn Hệ Thống
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {selectedStream && (
            <button
              type="button"
              onClick={() => onSelectStream && onSelectStream(null)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors cursor-pointer"
              title="Bỏ chọn lát cắt để xem toàn bộ"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xem tất cả nguồn</span>
            </button>
          )}
          <div className="text-gray-500 flex items-center gap-1.5">
            <span>Tổng phát sinh:</span>
            <span className="tabular-nums font-bold text-gray-900 text-sm">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Compact Donut Chart + Generous Legend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Compact Donut SVG (w-44 h-44, no artificial gray ring) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {streamSum === 0 ? (
              <div className="w-40 h-40 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400 italic text-center p-4">
                Chưa có giao dịch phát sinh trong kỳ
              </div>
            ) : (
              <svg
                viewBox="0 0 180 180"
                className="w-full h-full transform -rotate-90"
                aria-label="Biểu đồ tròn cơ cấu nguồn thu"
              >
                {segments.map((seg) => {
                  if (seg.percent <= 0) return null;
                  const isSelected = selectedStream === seg.id;
                  const isHovered = hoveredStreamId === seg.id;
                  const isDimmed = activeStreamId !== null && activeStreamId !== seg.id;

                  return (
                    <circle
                      key={seg.id}
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="transparent"
                      stroke={seg.hexColor}
                      strokeWidth={isSelected || isHovered ? strokeWidth + 3 : strokeWidth}
                      strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="butt"
                      className={`transition-all duration-200 cursor-pointer ${
                        isDimmed ? 'opacity-30' : 'opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredStreamId(seg.id)}
                      onMouseLeave={() => setHoveredStreamId(null)}
                      onClick={() => handleStreamClick(seg.id)}
                    >
                      <title>{`${seg.label}: ${formatCurrency(seg.amount)} (${(seg.percent * 100).toFixed(1)}%)`}</title>
                    </circle>
                  );
                })}
              </svg>
            )}

            {/* Center Label */}
            {streamSum > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-5">
                {activeStream ? (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 max-w-[105px] truncate">
                      {activeStream.shortLabel}
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums text-gray-900 leading-tight max-w-[110px] truncate"
                      title={formatCurrency(activeStream.amount)}
                    >
                      {formatCurrency(activeStream.amount)}
                    </span>
                    <span className={`text-[11px] font-bold tabular-nums mt-0.5 ${activeStream.twText}`}>
                      {activePercent !== null ? `${activePercent.toFixed(1)}%` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Tổng thực thu
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums text-gray-900 leading-tight max-w-[112px] truncate"
                      title={formatCurrency(total)}
                    >
                      {formatCurrency(total)}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                      100% tỷ trọng
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Legend (md:col-span-8) */}
        <div className="md:col-span-8 divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
          {streams.map((s) => {
            const percent = streamSum > 0 ? (s.amount / streamSum) * 100 : 0;
            const isSelected = selectedStream === s.id;
            const isHovered = hoveredStreamId === s.id;
            const isDimmed = activeStreamId !== null && activeStreamId !== s.id;

            return (
              <div
                key={s.id}
                onClick={() => handleStreamClick(s.id)}
                onMouseEnter={() => setHoveredStreamId(s.id)}
                onMouseLeave={() => setHoveredStreamId(null)}
                className={`px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-brand-50/70'
                    : isHovered
                    ? 'bg-gray-50'
                    : isDimmed
                    ? 'bg-white opacity-45 hover:opacity-85'
                    : 'bg-white hover:bg-gray-50/80'
                }`}
                title={`${s.desc} (Nhấn để ${isSelected ? 'bỏ lọc' : 'lọc chéo trên bảng'})`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.twBg} shrink-0`} />
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {s.label}
                    </span>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-100 text-brand-800 shrink-0">
                        Đang lọc
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <div className="text-xs font-semibold text-gray-900">
                    {formatCurrency(s.amount)}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {percent.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overflow-safe 2-Column Grid Reconciliation Bar */}
      <div className="pt-3 border-t border-gray-200">
        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 items-center gap-3 text-xs">
          <span className="text-gray-600 font-medium">
            Đối soát hoàn tiền &amp; thực nhận ròng:
          </span>

          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1 sm:justify-self-end max-w-full">
            <span className="text-gray-500 text-right whitespace-nowrap">Hoàn trả khách:</span>
            <span
              className="tabular-nums font-bold text-rose-600 text-sm text-right truncate max-w-[240px]"
              title={refundDisplay}
            >
              {refundDisplay}
            </span>

            <span className="text-gray-700 font-semibold text-right whitespace-nowrap">
              Thực nhận ròng (Net):
            </span>
            <span
              className="tabular-nums font-bold text-emerald-700 text-sm text-right truncate max-w-[240px]"
              title={netDisplay}
            >
              {netDisplay}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
