import React from 'react';
import { ShieldCheck, Calendar, CreditCard, AlertCircle, Phone, User, KeyRound, ArrowLeft } from 'lucide-react';
import type { CheckInContract } from '../../../types';

export interface CustomerVerificationCardProps {
  contract: CheckInContract;
  onBack?: () => void;
}

export const CustomerVerificationCard: React.FC<CustomerVerificationCardProps> = ({ contract, onBack }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Header thẻ Hồ sơ tiếp đón */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Quay lại Nhiệm vụ ca trực"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <KeyRound className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Hồ sơ tiếp đón
          </span>
        </div>
        <span className="font-mono text-xs font-bold text-slate-500">
          #{contract.code}
        </span>
      </div>

      {/* 1. Thông tin ô kho bàn giao */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Ô kho bàn giao:</span>
          <span className="font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md text-sm">
            {contract.storageUnitCode}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Vị trí & Tầng:</span>
          <span className="font-semibold text-slate-800">
            Tầng {contract.floor} · {contract.position}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 shrink-0">Loại ô kho:</span>
          <span className="font-semibold text-slate-800 text-right">
            {contract.unitTypeName}
          </span>
        </div>
        {contract.unitTypeDimensions && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500 shrink-0">Kích thước:</span>
            <span className="font-medium text-slate-700 text-right">
              {contract.unitTypeDimensions}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500 shrink-0">Cơ sở:</span>
          <span className="font-medium text-slate-800 text-right truncate">
            {contract.facilityName}
          </span>
        </div>
      </div>

      {/* 2. Xác minh khách hàng & CCCD */}
      <div className="space-y-2.5 pt-1 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-900 text-sm">{contract.customerName}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              CCCD: <strong className="font-mono text-slate-900">{contract.customerIdentityNumber}</strong>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md shrink-0">
            Trùng khớp ✓
          </span>
        </div>

        {contract.customerPhone && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono font-semibold text-slate-800">{contract.customerPhone}</span>
            </div>
            <a
              href={`tel:${contract.customerPhone}`}
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
            >
              <span>Gọi điện</span>
            </a>
          </div>
        )}
      </div>

      {/* 3. Kỳ hạn thuê & Thanh toán */}
      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-teal-600" /> Kỳ hạn ({contract.rentalMonths} tháng):
          </span>
          <strong className="text-slate-900 font-mono">
            {contract.startDate} → {contract.endDateExclusive}
          </strong>
        </div>

        <div className="flex items-center justify-between text-slate-600">
          <span className="text-slate-500">Ngày bắt đầu & Ân hạn (BR-CHK-05):</span>
          <strong className="text-teal-700 bg-teal-50 border border-teal-200/70 px-2 py-0.5 rounded-md font-semibold">
            Ân hạn {contract.checkinGraceDays ?? 10} ngày (Còn {contract.graceDaysRemaining ?? 10} ngày)
          </strong>
        </div>

        <div className="flex items-center justify-between text-slate-600 pt-1">
          <span className="flex items-center gap-1.5 text-slate-500">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Tổng thanh toán (Thuê + Cọc):
          </span>
          <strong className="font-mono text-sm text-slate-900 font-bold">
            {formatCurrency(contract.totalPayable)}
          </strong>
        </div>

        <div className="pt-1">
          {contract.isFullyPaid ? (
            <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Đã thanh toán đủ 100% (Đủ điều kiện nhận kho)</span>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Chưa hoàn tất thanh toán (Tạm khóa bàn giao)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

