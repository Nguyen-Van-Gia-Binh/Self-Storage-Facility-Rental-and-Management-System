// frontend/src/features/manager/components/reports/FacilityRevenueBreakdown.tsx

import React from 'react';
import { DollarSign, Shield, PlusCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    return <div className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />;
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Báo cáo tài chính cơ sở tháng {data.month || 'hiện tại'} (US-FM-06.1 AC-3)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp các nguồn thu phí thuê, số dư tiền cọc đang giữ và các khoản phụ phí phát sinh
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 font-medium">Tổng doanh thu thực nhận:</span>
          <div className="text-xl font-black text-blue-600">{formatVND(data.totalRevenue)}</div>
        </div>
      </div>

      {/* 3 Cấu phần doanh thu chính */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Khối 1: Doanh thu phí thuê */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">Doanh thu phí thuê</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">{formatVND(data.rentalRevenue)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Thu từ các hợp đồng thuê đang hiệu lực trong kỳ
          </p>
        </div>

        {/* Khối 2: Tiền cọc giữ chỗ */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">Tiền cọc ký quỹ (Deposit)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-600">{formatVND(data.depositBalance)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Số dư tiền cọc bảo chứng hiện đang quản lý
          </p>
        </div>

        {/* Khối 3: Phụ phí & Dịch vụ */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-semibold">Phụ phí & Dịch vụ</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-purple-600">{formatVND(data.surchargeRevenue)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Phí phạt quá hạn, phí bảo trì, cấp thẻ truy cập
          </p>
        </div>
      </div>

      {/* Tình hình luân chuyển hợp đồng trong tháng */}
      <div className="pt-2 border-t border-slate-100">
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
