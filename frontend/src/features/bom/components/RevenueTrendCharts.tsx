import React from 'react';
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
import { BarChart3, LineChart as LineChartIcon, Info } from 'lucide-react';
import type { MonthlyRevenueTrend } from '@/types';
import { formatCurrency } from '@/utils/format';

export interface RevenueTrendChartsProps {
  data?: MonthlyRevenueTrend[];
  isLoading?: boolean;
}

/** Rút gọn số tiền trục Y: VD 15000000 -> 15 tr */
function formatShortMillion(value: number): string {
  if (value === 0) return '0';
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
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[200px]">
      <div className="font-semibold text-slate-800 pb-1.5 border-b border-slate-100 flex items-center justify-between">
        <span>Tháng {label}</span>
        <span className="font-mono tabular-nums text-brand-700 font-bold">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-slate-600">
            <div className="flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.name}</span>
            </div>
            <span className="font-mono tabular-nums text-slate-900 font-medium shrink-0">
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
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[210px]">
      <div className="font-semibold text-slate-800 pb-1.5 border-b border-slate-100">
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
              <span className="text-slate-600">{entry.name}</span>
            </div>
            <span className="font-mono tabular-nums text-slate-900 font-bold">
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
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-[280px] bg-slate-100 rounded-lg" />
        </div>
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
          <div className="h-[280px] bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  // Chuẩn bị dữ liệu hiển thị (gộp tiền thuê và tiền gia hạn vào nhóm Core Rental)
  const chartData = data.map((item) => ({
    ...item,
    totalRentAndRenewal: item.rentalRevenue + item.renewalRevenue,
  }));

  const hasData = chartData.length > 0 && chartData.some((d) => d.cashFlow > 0 || d.mrr > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm text-center">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">Chưa có đủ dữ liệu xu hướng</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Dữ liệu dòng tiền và doanh thu định kỳ 12 tháng sẽ tự động hiển thị khi hệ thống ghi nhận các giao dịch thanh toán trong năm.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* 1. Biểu đồ Cột Chồng (Stacked Bar Chart) - 60% chiều ngang (lg:col-span-7) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-600 stroke-[2]" />
              <h3 className="text-sm font-bold text-slate-900">
                Xu Hướng Dòng Tiền Thực Thu (12 Tháng)
              </h3>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0d9488]" />
                <span>Thuê kho & Gia hạn</span>
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

          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatShortMillion}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<StackedBarTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar
                  dataKey="totalRentAndRenewal"
                  name="Thuê kho & Gia hạn"
                  stackId="cashflow"
                  fill="#0d9488"
                />
                <Bar
                  dataKey="surchargeRevenue"
                  name="Phụ phí dịch vụ"
                  stackId="cashflow"
                  fill="#64748b"
                />
                <Bar
                  dataKey="overdueFeeRevenue"
                  name="Phạt quá hạn"
                  stackId="cashflow"
                  fill="#f43f5e"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Đơn vị: VNĐ • Cột chồng thể hiện cơ cấu tiền thực thu từng tháng</span>
          <span className="font-mono text-[10px] text-slate-400">12 Kỳ gần nhất</span>
        </div>
      </div>

      {/* 2. Biểu đồ Đường So Sánh (Line Chart) - 40% chiều ngang (lg:col-span-5) */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-sky-600 stroke-[2]" />
              <h3 className="text-sm font-bold text-slate-900">
                Thực Thu (Cash) vs Định Kỳ (MRR)
              </h3>
            </div>
            {/* Custom Legend */}
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#0d9488] rounded-full inline-block" />
                <span>Thực thu (Cash)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-[#0284c7] inline-block" />
                <span>MRR</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatShortMillion}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<LineChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cashFlow"
                  name="Dòng tiền thực thu"
                  stroke="#0d9488"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#0d9488' }}
                  activeDot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="mrr"
                  name="Doanh thu định kỳ (MRR)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 2.5, fill: '#0284c7' }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Nếu Cash Flow tụt dưới đường MRR nét đứt, hệ thống cảnh báo khách hàng có xu hướng chậm thanh toán hoặc nợ quá hạn.
          </span>
        </div>
      </div>
    </div>
  );
};
