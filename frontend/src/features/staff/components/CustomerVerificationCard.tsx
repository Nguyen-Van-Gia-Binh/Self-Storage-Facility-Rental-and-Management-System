import React from 'react';
import { UserCheck, ShieldCheck, MapPin, Calendar, CreditCard, Box, AlertCircle, Phone } from 'lucide-react';
import type { CheckInContract } from '../../../types';

export interface CustomerVerificationCardProps {
  contract: CheckInContract;
}

export const CustomerVerificationCard: React.FC<CustomerVerificationCardProps> = ({ contract }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">{contract.customerName}</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-500/30 text-brand-300 border border-brand-500/40">
                  Khách thuê
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5 font-mono">
                <span>HĐ: {contract.code}</span>
                <span>•</span>
                <span>Đơn: {contract.reservationCode}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium">Cơ sở:</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-lg text-white border border-white/10">
              {contract.facilityName}
            </span>
          </div>
        </div>
      </div>

      {/* Thông tin đối soát 3 cột */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 bg-slate-50/50 text-xs">
        {/* Cột 1: Giấy tờ tùy thân & Liên hệ (BR-CHK-01) */}
        <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            Đối soát danh tính (BR-CHK-01)
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Số CCCD / Hộ chiếu:</div>
            <div className="text-sm font-mono font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
              {contract.customerIdentityNumber}
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                Trùng khớp ✓
              </span>
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Số điện thoại liên hệ:</div>
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              {contract.customerPhone}
            </div>
          </div>
        </div>

        {/* Cột 2: Ô kho vật lý đã phân bổ */}
        <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Box className="w-3.5 h-3.5 text-brand-600" />
            Vị trí ô kho thực tế
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px]">Mã ô kho:</div>
              <div className="text-base font-mono font-extrabold text-brand-700">
                {contract.storageUnitCode}
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-500 text-[11px]">Tầng & Vị trí:</div>
              <div className="text-xs font-semibold text-slate-800">
                Tầng {contract.floor}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate" title={contract.position}>
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{contract.position}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Loại kho: <span className="font-semibold text-slate-800">{contract.unitTypeName}</span> ({contract.unitTypeDimensions})
          </div>
        </div>

        {/* Cột 3: Thời hạn thuê & Lịch trình */}
        <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            Kỳ hạn thuê ({contract.rentalMonths} tháng)
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Khoảng thời gian thuê:</div>
            <div className="text-xs font-semibold text-slate-800 mt-0.5">
              {contract.startDate} → {contract.endDateExclusive}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">Giờ hẹn bàn giao:</div>
            <div className="text-xs font-semibold text-brand-700 mt-0.5">
              {contract.appointmentTime}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh trạng thái thanh toán tài chính (BR-CHK-02) */}
      <div className="p-3.5 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <span className="text-slate-500">Tiền thuê ({contract.rentalMonths}T):</span>
            <span className="font-bold text-slate-800">{formatCurrency(contract.totalRentalFee)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Cọc Deposit:</span>
            <span className="font-bold text-slate-800">{formatCurrency(contract.depositAmount)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <span>Tổng thu:</span>
            <span className="text-sm font-extrabold text-slate-900">{formatCurrency(contract.totalPayable)}</span>
          </div>
        </div>

        <div>
          {contract.isFullyPaid ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-lg border border-emerald-300 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ĐÃ THANH TOÁN ĐỦ 100% QUA VIETQR (ĐỦ ĐIỀU KIỆN NHẬN KHO)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 px-3 py-1 rounded-lg border border-red-300">
              <AlertCircle className="w-4 h-4 text-red-600" />
              CHƯA HOÀN TẤT THANH TOÁN (VÔ HIỆU HÓA BÀN GIAO)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
