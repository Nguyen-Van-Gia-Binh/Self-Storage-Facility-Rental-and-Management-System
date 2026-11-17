import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { MonthlyRevenueTrend } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface RevenueTrendChartsProps {
  data?: MonthlyRevenueTrend[];
  isLoading?: boolean;
}

/** Rút gọn số tiền trục Y: VD 15000000 -> 15 tr, 1500000000 -> 1.5 tỷ */
function formatShortAxis(value: number): string {
  if (value === 0) return '0';
  const billions = value / 1_000_000_000;
  if (Math.abs(billions) >= 1) {
    return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)} tỷ`;
  }
  const millions = value / 1_000_000;
  if (Math.abs(millions) >= 1) {
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} tr`;
  }
  return `${(value / 1_000).toFixed(0)} k`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const StackedBarTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-gray-200 rounded-md shadow-lg p-3 text-xs min-w-[200px]">
      <div className="font-semibold text-gray-800 pb-1.5 border-b border-gray-100 flex items-center justify-between gap-3">
        <span>Tháng {label}</span>
        <span className="tabular-nums text-brand-700 font-bold">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-gray-600">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </div>
            <span className="tabular-nums text-gray-900 font-medium shrink-0">
              {formatCurrency(Number(entry.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-gray-200 rounded-md shadow-lg p-3 text-xs min-w-[210px]">
      <div className="font-semibold text-gray-800 pb-1.5 border-b border-gray-100">
        Tháng {label}
      </div>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}</span>
            </div>
            <span className="tabular-nums text-gray-900 font-bold">
              {formatCurrency(Number(entry.value) || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RevenueTrendCharts: React.FC<RevenueTrendChartsProps> = ({
  data = [],
  isLoading = false,
}) => {
  const { activeChartData, trimmedLeadingCount } = useMemo(() => {
    const mapped = data.map((item) => ({
      ...item,
      totalRentAndRenewal: item.rentalRevenue + item.renewalRevenue,
    }));
    const firstActiveIdx = mapped.findIndex(
      (d) => d.cashFlow > 0 || d.mrr > 0 || d.totalRentAndRenewal > 0 || d.surchargeRevenue > 0 || d.overdueFeeRevenue > 0
    );
    if (firstActiveIdx <= 0) {
      return { activeChartData: mapped, trimmedLeadingCount: 0 };
    }
    return {
      activeChartData: mapped.slice(firstActiveIdx),
      trimmedLeadingCount: firstActiveIdx,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-md border border-gray-200 p-5 animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-[260px] bg-gray-100 rounded-md" />
        </div>
        <div className="lg:col-span-5 bg-white rounded-md border border-gray-200 p-5 animate-pulse space-y-4">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-[260px] bg-gray-100 rounded-md" />
        </div>
      </div>
    );
  }

  const hasData = activeChartData.length > 0 && activeChartData.some((d) => d.cashFlow > 0 || d.mrr > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
        <BarChart3 className="w-9 h-9 text-gray-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-gray-700">Chưa có đủ dữ liệu xu hướng</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
          Dữ liệu dòng tiền và doanh thu định kỳ sẽ tự động hiển thị khi hệ thống ghi nhận các giao dịch thanh toán.
        </p>
      </div>
    );
  }

  const firstActiveLabel = activeChartData[0]?.monthLabel;
  const isSinglePoint = activeChartData.length === 1;
  const showLineDots = activeChartData.length <= 4;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Biểu đồ Cột Chồng (Stacked Bar Chart) */}
      <div className="lg:col-span-7 bg-white rounded-md border border-gray-200 p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Xu Hướng Dòng Tiền Thực Thu (12 Tháng)
              </h3>
              {trimmedLeadingCount > 0 && firstActiveLabel && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Hiển thị từ {firstActiveLabel} ({trimmedLeadingCount} tháng trước chưa phát sinh giao dịch)
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0d9488]" />
                <span>Thuê kho &amp; Gia hạn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#64748b]" />
                <span>Phụ phí</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#f43f5e]" />
                <span>Phạt quá hạn</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatShortAxis}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                />
                <Tooltip content={<StackedBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="totalRentAndRenewal"
                  name="Thuê kho & Gia hạn"
                  stackId="cashflow"
                  fill="#0d9488"
                  maxBarSize={48}
                />
                <Bar
                  dataKey="surchargeRevenue"
                  name="Phụ phí dịch vụ"
                  stackId="cashflow"
                  fill="#64748b"
                  maxBarSize={48}
                />
                <Bar
                  dataKey="overdueFeeRevenue"
                  name="Phạt quá hạn"
                  stackId="cashflow"
                  fill="#f43f5e"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Biểu đồ So Sánh Thực Thu vs MRR */}
      <div className="lg:col-span-5 bg-white rounded-md border border-gray-200 p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Thực Thu (Cash) vs Định Kỳ (MRR)
              </h3>
              {isSinglePoint && firstActiveLabel && (
                <p className="text-[11px] text-gray-500 mt-0.5">
                  So sánh tháng phát sinh đầu tiên ({firstActiveLabel})
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0d9488] inline-block" />
                <span>Thực thu (Cash)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#94a3b8] inline-block" />
                <span>MRR</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isSinglePoint ? (
                <BarChart data={activeChartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatShortAxis}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                  />
                  <Tooltip content={<LineChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="cashFlow" name="Dòng tiền thực thu" fill="#0d9488" radius={[3, 3, 0, 0]} maxBarSize={44} />
                  <Bar dataKey="mrr" name="Doanh thu định kỳ (MRR)" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={44} />
                </BarChart>
              ) : (
                <LineChart data={activeChartData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatShortAxis}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                  />
                  <Tooltip content={<LineChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="cashFlow"
                    name="Dòng tiền thực thu"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={showLineDots ? { r: 3.5, fill: '#0d9488' } : false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    name="Doanh thu định kỳ (MRR)"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={showLineDots ? { r: 3.5, fill: '#94a3b8' } : false}
                    activeDot={{ r: 5, fill: '#94a3b8' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
