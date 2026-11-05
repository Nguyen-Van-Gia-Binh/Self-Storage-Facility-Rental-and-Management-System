// frontend/src/features/manager/components/reports/FacilityRevenueChart.tsx

import React, { useState } from 'react';
import {
  PieChart,
  ArrowDownRight,
  RotateCcw,
} from 'lucide-react';
import type { FacilityOverviewReport } from '../../types/report';

export interface FacilityRevenueChartProps {
  data: FacilityOverviewReport;
  loading?: boolean;
  selectedStreamId?: string | null;
  onSelectStream?: (streamId: string | null) => void;
}

interface StreamItem {
  id: string;
  label: string;
  amount: number;
  hexColor: string;
  twBg: string;
  twText: string;
  twBorder: string;
  desc: string;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export const FacilityRevenueChart: React.FC<FacilityRevenueChartProps> = ({
  data,
  loading = false,
  selectedStreamId = null,
  onSelectStream,
}) => {
  const [hoveredStreamId, setHoveredStreamId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-52 h-52 rounded-full bg-slate-100" />
          </div>
          <div className="lg:col-span-7 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 1. Phí thuê kho
  const rentalRevenue = data.rentalRevenue ?? 0;
  // 2. Phí dịch vụ khách trả
  const customerServiceFee = data.customerServiceFee ?? data.surchargeRevenue ?? 0;
  // 3. Phí phạt quá hạn
  const overduePenaltyFee = data.overduePenaltyFee ?? 0;
  // 4. Tiền cọc giữ chỗ & đảm bảo
  const depositBalance = data.depositBalance ?? 0;
  // 5. Chi phí sự cố công ty chịu (Khoản giảm trừ)
  const companyIncidentCost = data.companyIncidentCost ?? 0;

  // Tổng các nguồn thu vào để tính cơ cấu tỷ trọng
  const streamSum = rentalRevenue + customerServiceFee + overduePenaltyFee + depositBalance;

  // Doanh thu thuần = (Phí thuê + Dịch vụ + Quá hạn) - Chi phí sự cố
  const grossInflow = rentalRevenue + customerServiceFee + overduePenaltyFee;
  const netRevenue = Math.max(0, grossInflow - companyIncidentCost);

  const streams: StreamItem[] = [
    {
      id: 'rental',
      label: 'Phí thuê kho',
      amount: rentalRevenue,
      hexColor: '#10b981', // emerald-500
      twBg: 'bg-emerald-500',
      twText: 'text-emerald-700',
      twBorder: 'border-emerald-200',
      desc: 'Doanh thu từ các hợp đồng thuê hiệu lực',
    },
    {
      id: 'service',
      label: 'Phí dịch vụ',
      amount: customerServiceFee,
      hexColor: '#8b5cf6', // purple-500
      twBg: 'bg-purple-500',
      twText: 'text-purple-700',
      twBorder: 'border-purple-200',
      desc: 'Phụ phí dịch vụ & sửa chữa do khách chịu',
    },
    {
      id: 'overdue',
      label: 'Phạt quá hạn',
      amount: overduePenaltyFee,
      hexColor: '#f59e0b', // amber-500
      twBg: 'bg-amber-500',
      twText: 'text-amber-700',
      twBorder: 'border-amber-200',
      desc: 'Phí phạt trễ hạn thanh toán từ D+4',
    },
    {
      id: 'deposit',
      label: 'Cọc giữ chỗ & đảm bảo',
      amount: depositBalance,
      hexColor: '#0ea5e9', // sky-500
      twBg: 'bg-sky-500',
      twText: 'text-sky-700',
      twBorder: 'border-sky-200',
      desc: 'Ký quỹ hợp đồng đang duy trì tại cơ sở',
    },
  ];

  // Kích thước SVG Donut
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.82
  let accumulatedOffset = 0;

  // Lát cắt đang được chú ý (hover hoặc chọn)
  const activeStreamId = hoveredStreamId || selectedStreamId;
  const activeStream = streams.find((s) => s.id === activeStreamId);

  const handleStreamClick = (streamId: string) => {
    if (onSelectStream) {
      onSelectStream(selectedStreamId === streamId ? null : streamId);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6">
      {/* Tiêu đề Component */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            Cơ cấu Dòng tiền & Doanh thu Cơ sở
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trực quan hóa tỷ trọng các nguồn thu vào và đối soát khoản chi phí sự cố công ty chi trả
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedStreamId && onSelectStream && (
            <button
              onClick={() => onSelectStream(null)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xem tất cả</span>
            </button>
          )}
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            Tháng {data.month || 'hiện tại'}
          </span>
        </div>
      </div>

      {/* Grid Biểu đồ & Bảng phân rã */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* CỘT TRÁI: Donut Chart SVG */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-56 h-56 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 200 200"
              aria-label="Biểu đồ cơ cấu doanh thu cơ sở"
            >
              {/* Vòng nền xám */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-slate-100 fill-none"
                strokeWidth="24"
              />

              {streamSum > 0 ? (
                streams.map((stream) => {
                  const ratio = stream.amount / streamSum;
                  const strokeLength = ratio * circumference;
                  const strokeOffset = accumulatedOffset;
                  accumulatedOffset += strokeLength;

                  const isHovered = hoveredStreamId === stream.id;
                  const isSelected = selectedStreamId === stream.id;
                  const isMuted = activeStreamId && !isHovered && !isSelected;

                  return (
                    <circle
                      key={stream.id}
                      cx="100"
                      cy="100"
                      r={radius}
                      fill="none"
                      stroke={stream.hexColor}
                      strokeWidth={isHovered || isSelected ? 28 : 24}
                      strokeDasharray={`${strokeLength} ${circumference}`}
                      strokeDashoffset={-strokeOffset}
                      className={`cursor-pointer transition-all duration-300 ${
                        isMuted ? 'opacity-30' : 'opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredStreamId(stream.id)}
                      onMouseLeave={() => setHoveredStreamId(null)}
                      onClick={() => handleStreamClick(stream.id)}
                    />
                  );
                })
              ) : (
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  className="stroke-slate-200 fill-none"
                  strokeWidth="24"
                  strokeDasharray="6 6"
                />
              )}
            </svg>

            {/* Thông tin ở tâm Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
              {activeStream ? (
                <>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[130px]">
                    {activeStream.label}
                  </span>
                  <span className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {formatVND(activeStream.amount)}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 mt-0.5">
                    {streamSum > 0 ? formatPercent(activeStream.amount / streamSum) : '0%'}
                  </span>
                </>
              ) : streamSum > 0 ? (
                <>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Tổng dòng thu vào
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    {formatVND(streamSum)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 mt-0.5">
                    Thuần: {formatVND(netRevenue)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-400">
                    Chưa phát sinh dòng tiền
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    0 ₫
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 text-center">
            * Rê chuột hoặc bấm vào lát cắt để xem chi tiết
          </div>
        </div>

        {/* CỘT PHẢI: Chú giải tương tác & Bảng phân rã */}
        <div className="lg:col-span-7 space-y-4">
          {/* Thanh phân bổ tỷ trọng ngang (Stacked Horizontal Bar) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Thanh phân bổ tỷ trọng dòng tiền:</span>
              <span className="font-mono text-slate-500">
                {streamSum > 0 ? '100%' : '0%'}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {streamSum > 0 ? (
                streams.map((stream) => {
                  const widthPct = (stream.amount / streamSum) * 100;
                  if (widthPct === 0) return null;
                  return (
                    <div
                      key={stream.id}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: stream.hexColor,
                      }}
                      className="h-full transition-all duration-300"
                      title={`${stream.label}: ${formatVND(stream.amount)} (${widthPct.toFixed(1)}%)`}
                    />
                  );
                })
              ) : (
                <div className="w-full h-full bg-slate-200" />
              )}
            </div>
          </div>

          {/* Danh sách 4 dòng tiền dạng Card tương tác */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {streams.map((stream) => {
              const isSelected = selectedStreamId === stream.id;
              const isHovered = hoveredStreamId === stream.id;
              const pct = streamSum > 0 ? (stream.amount / streamSum) * 100 : 0;

              return (
                <div
                  key={stream.id}
                  data-testid={`stream-item-${stream.id}`}
                  onClick={() => handleStreamClick(stream.id)}
                  onMouseEnter={() => setHoveredStreamId(stream.id)}
                  onMouseLeave={() => setHoveredStreamId(null)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-50 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                      : isHovered
                      ? 'bg-slate-50/80 border-slate-300 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stream.hexColor }}
                      />
                      <span className="text-xs font-bold text-slate-800">{stream.label}</span>
                    </div>
                    <span className="text-[11px] font-black font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-sm font-black font-mono text-slate-900">
                    {formatVND(stream.amount)}
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {stream.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Callout Chi phí sự cố công ty chi trả (Khấu trừ) */}
          {companyIncidentCost > 0 && (
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-rose-900">
                    Chi phí sự cố công ty chi trả (Khấu trừ)
                  </div>
                  <div className="text-[11px] text-rose-600">
                    Bồi thường & chi phí sửa chữa cơ sở đài thọ
                  </div>
                </div>
              </div>
              <div className="text-sm font-black font-mono text-rose-700">
                - {formatVND(companyIncidentCost)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
