import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  CreditCard,
  XCircle,
  MapPin,
  Calendar,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { ReservationResponse } from '@/api/reservation';

export interface PendingReservationCardProps {
  reservation: ReservationResponse;
  onCancel?: (reservation: ReservationResponse) => void;
}

export const PendingReservationCard: React.FC<PendingReservationCardProps> = ({
  reservation,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!reservation.holdExpiresAt) return 48 * 3600;
    const diff = Math.floor((new Date(reservation.holdExpiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!reservation.holdExpiresAt) return;
    const updateCountdown = () => {
      const diff = Math.floor((new Date(reservation.holdExpiresAt).getTime() - Date.now()) / 1000);
      setSecondsLeft(Math.max(0, diff));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [reservation.holdExpiresAt]);

  const isExpired = secondsLeft <= 0;

  const formattedCountdown = useMemo(() => {
    if (isExpired) return 'Đã hết hạn';
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [secondsLeft, isExpired]);

  const formatDateVN = (dStr?: string) => {
    if (!dStr) return '';
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const bookingUrl = `/customer/booking?facility=${reservation.facilityId}&type=${reservation.unitTypeId}${
    reservation.storageUnitId ? `&unitId=${reservation.storageUnitId}` : ''
  }&months=${reservation.rentalMonths}&startDate=${reservation.startDate}`;

  return (
    <Card className="p-4 sm:p-5 bg-gradient-to-br from-sky-50/40 via-white to-blue-50/20 border-2 border-sky-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 space-y-4 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 uppercase tracking-wider font-mono">
              Ô kho {reservation.storageUnitCode || reservation.unitTypeName || 'Tự động phân bổ'}
            </span>
            <Badge className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 shadow-xs">
              <Clock className="w-3 h-3" />
              Đang giữ chỗ 48h
            </Badge>
            <span className="text-xs text-slate-400 font-mono">#{reservation.code}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            {reservation.unitTypeName || 'Loại ô kho tiêu chuẩn'}
          </h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>{reservation.facilityName || 'Cơ sở lưu trữ SmartStorage'}</span>
          </p>
        </div>

        {/* Realtime Countdown Box */}
        <div className="sm:text-right shrink-0 bg-white/90 p-2.5 sm:p-3 rounded-xl border border-sky-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
            Thời gian giữ chỗ còn lại
          </span>
          <div className="flex items-center sm:justify-end gap-1.5 font-mono text-sm sm:text-base font-black text-sky-700">
            <Clock className={`w-4 h-4 ${isExpired ? 'text-rose-500' : 'text-sky-600 animate-pulse'}`} />
            <span className={isExpired ? 'text-rose-600' : 'text-sky-800'}>
              {formattedCountdown}
            </span>
          </div>
          {!isExpired && (
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Hết hạn lúc: {new Date(reservation.holdExpiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(reservation.holdExpiresAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {/* Summary Content Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/80 p-3 sm:p-3.5 rounded-xl border border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Thời gian thuê:</span>
          <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            {reservation.rentalMonths} Tháng (từ {formatDateVN(reservation.startDate)})
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Đơn giá tháng:</span>
          <span className="font-bold text-slate-800 mt-0.5 block">
            {formatVND(reservation.monthlyPrice)}/tháng
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Tổng tiền cần thanh toán:</span>
          <span className="font-black text-sm text-brand-600 mt-0.5 block">
            {formatVND(reservation.totalPayable || reservation.depositAmount)}
          </span>
          {reservation.depositAmount > 0 && (
            <span className="text-[10px] text-slate-400 block">
              (Đã gồm tiền cọc: {formatVND(reservation.depositAmount)})
            </span>
          )}
        </div>
      </div>

      {/* Notice */}
      <div className="bg-sky-50/70 p-2.5 rounded-xl border border-sky-100/90 text-xs text-sky-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Ô kho đang được giữ độc quyền cho bạn. Vui lòng hoàn tất thanh toán cọc VietQR trước khi hết thời gian giữ chỗ!
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCancel?.(reservation)}
          className="w-full sm:w-auto text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-semibold cursor-pointer"
        >
          <XCircle className="w-4 h-4 mr-1.5 text-rose-500" />
          Hủy giữ chỗ
        </Button>

        <Link to={bookingUrl} className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-sky-600 to-brand-600 hover:from-sky-700 hover:to-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>Tiếp tục thanh toán VietQR</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
};
