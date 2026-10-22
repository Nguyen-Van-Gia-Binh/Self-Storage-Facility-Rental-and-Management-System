import React, { useState } from 'react';
import { PieChart, Info, AlertTriangle, RotateCcw } from 'lucide-react';
import type { SystemRevenueReport } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/format';

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
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="w-48 h-48 bg-slate-100 rounded-full mx-auto" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl" />
          ))}
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

  // Tổng các khoản phát sinh để tính tỷ trọng
  const streamSum = rental + deposit + surcharge + renewal + overdue;

  const streams: StreamItem[] = [
    {
      id: 'rental',
      label: 'Tiền thuê kho',
      shortLabel: 'Tiền thuê',
      amount: rental,
      hexColor: '#10b981', // emerald-500
      twBg: 'bg-emerald-500',
      twText: 'text-emerald-700',
      desc: 'Dòng tiền hợp đồng cốt lõi theo tháng/kỳ',
    },
    {
      id: 'renewal',
      label: 'Phí gia hạn',
      shortLabel: 'Gia hạn',
      amount: renewal,
      hexColor: '#6366f1', // indigo-500
      twBg: 'bg-indigo-500',
      twText: 'text-indigo-700',
      desc: 'Hợp đồng tái tục kỳ mới của khách quen',
    },
    {
      id: 'deposit',
      label: 'Cọc giữ chỗ & đảm bảo',
      shortLabel: 'Tiền cọc',
      amount: deposit,
      hexColor: '#0ea5e9', // sky-500
      twBg: 'bg-sky-500',
      twText: 'text-sky-700',
      desc: 'Khoản ký quỹ đảm bảo thực hiện hợp đồng',
    },
    {
      id: 'surcharge',
      label: 'Phụ phí dịch vụ',
      shortLabel: 'Phụ phí',
      amount: surcharge,
      hexColor: '#f59e0b', // amber-500
      twBg: 'bg-amber-500',
      twText: 'text-amber-700',
      desc: 'Bốc dỡ, điện lạnh, xe nâng, vật tư đóng gói',
    },
    {
      id: 'overdue',
      label: 'Phí phạt quá hạn',
      shortLabel: 'Phí quá hạn',
      amount: overdue,
      hexColor: '#f43f5e', // rose-500
      twBg: 'bg-rose-500',
      twText: 'text-rose-700',
      desc: 'Khoản phạt trễ hạn thanh toán hợp đồng',
    },
  ];

  // Tính toán thông số SVG Donut Chart
  const radius = 68;
  const circumference = 2 * Math.PI * radius; // ~427.25
  const strokeWidth = 26;
  const center = 100;

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

  // Tính tỷ lệ tiền hoàn trả so với tổng thu
  const refundRatio = total > 0 ? refund / total : 0;
  const netRevenue = Math.max(0, total - refund);

  const handleStreamClick = (streamId: string) => {
    if (!onSelectStream) return;
    if (selectedStream === streamId) {
      onSelectStream(null); // Click lại để hủy lọc chéo
    } else {
      onSelectStream(streamId);
    }
  };

  return (
    <div className="space-y-4">
      {/* KHỐI 1: BIỂU ĐỒ DONUT + CHÚ GIẢI + CẢNH BÁO HOÀN TIỀN */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm space-y-5">
        {/* Header khối */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Cơ Cấu Nguồn Thu & Đồng Tiền Toàn Hệ Thống
              </h3>
              <p className="text-xs text-slate-500">
                Phân bổ doanh thu gộp theo từng cấu phần dòng tiền trong kỳ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {selectedStream && (
              <button
                type="button"
                onClick={() => onSelectStream && onSelectStream(null)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                title="Bỏ chọn lát cắt để xem toàn bộ"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xem tất cả nguồn</span>
              </button>
            )}
            <div className="text-slate-500 flex items-center gap-1.5">
              <span>Tổng phát sinh:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Thân biểu đồ Donut & Danh sách chú giải */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Cột trái: Donut Chart SVG */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-56 h-56 flex items-center justify-center">
              {streamSum === 0 ? (
                <div className="w-44 h-44 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 italic text-center p-4">
                  Chưa có giao dịch phát sinh trong kỳ
                </div>
              ) : (
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full transform -rotate-90 drop-shadow-sm"
                  aria-label="Biểu đồ tròn cơ cấu nguồn thu"
                >
                  {/* Vòng nền xám */}
                  <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                  />

                  {/* Các lát cắt doanh thu */}
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
                        strokeWidth={isSelected || isHovered ? strokeWidth + 4 : strokeWidth}
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

              {/* Thông tin ở tâm vòng tròn */}
              {streamSum > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                  {activeStream ? (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 max-w-[120px] truncate">
                        {activeStream.shortLabel}
                      </span>
                      <span className="text-base font-bold font-mono text-slate-900 tracking-tight leading-tight">
                        {formatCurrency(activeStream.amount)}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono mt-0.5 ${activeStream.twText}`}
                      >
                        {activePercent !== null ? `${activePercent.toFixed(1)}%` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Tổng thực thu
                      </span>
                      <span className="text-base font-bold font-mono text-slate-900 tracking-tight leading-tight">
                        {formatCurrency(total)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                        100% tỷ trọng
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              <span>Rê chuột để xem; Nhấn lát cắt để lọc nhanh bảng ma trận</span>
            </p>
          </div>

          {/* Cột phải: Danh sách chú giải (Legend) */}
          <div className="md:col-span-7 space-y-2">
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
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-1 ring-brand-400'
                      : isHovered
                      ? 'border-slate-300 bg-slate-50 shadow-sm'
                      : isDimmed
                      ? 'border-slate-100 bg-white opacity-40 hover:opacity-80'
                      : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                  title={`${s.desc} (Nhấn để ${isSelected ? 'bỏ lọc' : 'lọc chéo trên bảng'})`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${s.twBg} shrink-0`} />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s.label}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-brand-100 text-brand-800">
                            Đang lọc
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{s.desc}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                      {formatCurrency(s.amount)}
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-slate-500">
                      {percent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thanh ghi nhận Hoàn Tiền & Đối soát Thực Thu (Net Cash Flow) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold text-amber-950">
                  Khoản tiền đã xử lý / hoàn trả khách hàng:
                </span>{' '}
                <span className="text-amber-800">
                  (Hủy lịch đặt trước, chấm dứt hợp đồng sớm & cọc dư hoàn sau kiểm tra đồ)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
              <span className="font-mono font-bold text-rose-700 text-sm">
                - {formatCurrency(refund)}
              </span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-medium">Thực nhận ròng (Net):</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatCurrency(netRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 2: 4 THẺ SỐ LIỆU NHANH (MINI-KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Thẻ 1: Tiền thuê kho */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Tiền thuê kho</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(rental)}
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              {streamSum > 0 ? `${((rental / streamSum) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chiếm tỷ trọng doanh thu cốt lõi</p>
        </div>

        {/* Thẻ 2: Phí gia hạn */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Phí gia hạn</span>
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(renewal)}
            </span>
            <span className="text-xs font-mono font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {streamSum > 0 ? `${((renewal / streamSum) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Doanh thu tái tục từ khách hàng cũ</p>
        </div>

        {/* Thẻ 3: Tiền cọc giữ chỗ */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Tiền cọc giữ chỗ</span>
            <span className="w-2 h-2 rounded-full bg-sky-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
              {formatCurrency(deposit)}
            </span>
            <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
              {streamSum > 0 ? `${((deposit / streamSum) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ký quỹ bảo đảm & đặt chỗ trước</p>
        </div>

        {/* Thẻ 4: Tỷ lệ hoàn / Hủy (Điểm đau tài chính) */}
        <div
          className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
            refundRatio > 0.15
              ? 'border-rose-200 bg-rose-50/20'
              : refundRatio > 0.05
              ? 'border-amber-200 bg-amber-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-600">
              Tỷ lệ hoàn / Hủy
            </span>
            {refundRatio > 0.15 ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3" /> Cần chú ý
              </span>
            ) : refundRatio > 0 ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                Đã xử lý
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Tốt (0%)
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono tabular-nums text-rose-700">
              {formatCurrency(refund)}
            </span>
            <span className="text-xs font-mono font-bold text-rose-700">
              {formatPercent(refundRatio)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Chiếm {formatPercent(refundRatio)} tổng doanh thu gộp
          </p>
        </div>
      </div>
    </div>
  );
};
