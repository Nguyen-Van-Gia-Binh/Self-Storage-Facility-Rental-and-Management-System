// frontend/src/features/manager/components/reports/FacilityRevenueBreakdown.tsx

import React from 'react';
import {
  DollarSign,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Wrench,
  AlertTriangle,
  MinusCircle,
  TrendingUp,
  Info,
} from 'lucide-react';
import type { FacilityOverviewReport } from '../../types/report';

interface Props {
  data: FacilityOverviewReport;
  loading?: boolean;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FacilityRevenueBreakdown: React.FC<Props> = ({ data, loading }) => {
  if (loading) {
    return <div className="h-96 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  // 1. Phí thuê kho
  const rentalRevenue = data.rentalRevenue ?? 0;
  // 2. Phí dịch vụ (khách trả khi sự cố / phụ phí phát sinh)
  const customerServiceFee = data.customerServiceFee ?? data.surchargeRevenue ?? 0;
  // 3. Phí phạt quá hạn
  const overduePenaltyFee = data.overduePenaltyFee ?? 0;
  // 4. Chi phí sự cố công ty chịu
  const companyIncidentCost = data.companyIncidentCost ?? 0;
  // 5. Tổng doanh thu thuần = (Phí thuê + Phí dịch vụ + Phí quá hạn) - Chi phí công ty chịu
  const grossInflow = rentalRevenue + customerServiceFee + overduePenaltyFee;
  const netRevenue = data.netRevenue ?? Math.max(0, grossInflow - companyIncidentCost);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Báo cáo tài chính & Doanh thu cơ sở tháng {data.month || 'hiện tại'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân rã chi tiết các dòng thu (phí thuê, dịch vụ, quá hạn) và chi phí sự cố công ty chi trả theo quy chuẩn kế toán vận hành
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            Kế toán vận hành (Net Revenue)
          </span>
        </div>
      </div>

      {/* Grid 4 Card Thành phần cấu thành Doanh thu & Chi phí */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Doanh thu phí thuê */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold text-slate-800">1. Phí thuê kho</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-blue-700 font-mono">{formatVND(rentalRevenue)}</div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Thu từ các hợp đồng thuê đang hiệu lực trong kỳ
          </p>
        </div>

        {/* Card 2: Phí dịch vụ (khách tự trả khi sự cố / phụ phí) */}
        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold text-slate-800">2. Phí dịch vụ (Khách trả)</span>
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-purple-700 font-mono">{formatVND(customerServiceFee)}</div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Phụ phí dịch vụ & sửa chữa sự cố do khách chịu
          </p>
        </div>

        {/* Card 3: Phí phạt quá hạn */}
        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold text-slate-800">3. Phí phạt quá hạn</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-amber-700 font-mono">{formatVND(overduePenaltyFee)}</div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Phạt trễ hạn 10%/ngày trên tiền cọc từ D+4 đến D+10
          </p>
        </div>

        {/* Card 4: Chi phí sự cố công ty chịu */}
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-600 mb-2">
              <span className="text-xs font-bold text-rose-800">4. Chi phí công ty chịu</span>
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <MinusCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-black text-rose-600 font-mono">
              - {formatVND(companyIncidentCost)}
            </div>
          </div>
          <p className="text-[11px] text-rose-700/80 mt-2">
            Chi phí sửa chữa hư hỏng kỹ thuật cơ sở chịu 100%
          </p>
        </div>
      </div>

      {/* Card 5: TỔNG DOANH THU THUẦN (Card Tổng kết Nổi bật) */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold tracking-wide text-blue-200 uppercase">
                Tổng doanh thu thuần của cơ sở
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Công thức: <span className="font-semibold text-white">Tổng doanh thu = Phí thuê + Phí dịch vụ (khách trả) + Phí quá hạn − Chi phí công ty chịu</span>
            </p>
          </div>

          <div className="text-left lg:text-right">
            <div className="text-xs text-blue-300 font-medium">Doanh thu thuần thực tế kỳ này:</div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight mt-0.5">
              {formatVND(netRevenue)}
            </div>
          </div>
        </div>

        {/* Diễn giải chi tiết phép tính minh bạch */}
        <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300">
          <span className="text-slate-400 font-sans">Chi tiết:</span>
          <span className="text-blue-300">{formatVND(rentalRevenue)} (Thuê)</span>
          <span>+</span>
          <span className="text-purple-300">{formatVND(customerServiceFee)} (Dịch vụ)</span>
          <span>+</span>
          <span className="text-amber-300">{formatVND(overduePenaltyFee)} (Quá hạn)</span>
          <span>−</span>
          <span className="text-rose-400">{formatVND(companyIncidentCost)} (Công ty chịu)</span>
          <span>=</span>
          <span className="font-bold text-white bg-blue-600/30 px-2 py-0.5 rounded border border-blue-400/30">
            {formatVND(netRevenue)}
          </span>
        </div>
      </div>

      {/* Thông tin Tiền cọc ký quỹ (Deposit) - Hiển thị riêng biệt, không tính vào doanh thu */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Tiền cọc ký quỹ đang quản lý (Deposit Balance):
              </span>
              <span className="text-sm font-bold text-emerald-700 font-mono">
                {formatVND(data.depositBalance)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Khoản ký quỹ bảo đảm giữ hộ cho các hợp đồng đang hoạt động; không tính vào doanh thu thuần vận hành.
            </p>
          </div>
        </div>
      </div>

      {/* Tình hình luân chuyển hợp đồng trong tháng */}
      <div className="pt-1 border-t border-slate-100">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Biến động hợp đồng trong kỳ
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="text-[11px] text-slate-500 block">Đang hiệu lực</span>
            <span className="text-base font-bold text-slate-900">{data.activeContracts} HĐ</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ký mới trong tháng
            </span>
            <span className="text-base font-bold text-emerald-700">+{data.newContracts} HĐ</span>
          </div>
          <div className="p-3 rounded-lg border border-slate-100 bg-white">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" /> Đã kết thúc / Trả kho
            </span>
            <span className="text-base font-bold text-slate-700">{data.returnedContracts} HĐ</span>
          </div>
          <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/40">
            <span className="text-[11px] text-rose-600 font-medium block">Quá hạn thanh toán</span>
            <span className="text-base font-bold text-rose-700">{data.overdueContracts} HĐ</span>
          </div>
        </div>
      </div>
    </div>
  );
};
