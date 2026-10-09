import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  CreditCard,
  XCircle,
  ArrowRight,
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

  const bookingUrl = `/customer/booking?reservationId=${reservation.id}&facility=${reservation.facilityId}&type=${reservation.unitTypeId}${
    reservation.storageUnitId ? `&unitId=${reservation.storageUnitId}` : ''
  }${
    reservation.storageUnitCode ? `&unitNumber=${encodeURIComponent(reservation.storageUnitCode)}` : ''
  }&months=${reservation.rentalMonths}&startDate=${reservation.startDate}`;

  return (
    <div className="bg-white border border-rose-200/90 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs hover:shadow-md">
      {/* LEFT INFO */}
      <div className="flex items-start gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 font-mono font-black text-xs shrink-0">
          {reservation.storageUnitCode ? reservation.storageUnitCode.split('-').pop() : 'RSV'}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">
              Đơn giữ chỗ {reservation.storageUnitCode || reservation.unitTypeName || `#${reservation.code}`}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {(reservation.unitTypeName || 'Kho tiêu chuẩn').replace(/\s*\([^)]*\)/g, '').trim()}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              <Clock className="w-3 h-3 text-rose-600 animate-pulse" />
              <span>Hết hạn: {formattedCountdown}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {reservation.facilityName || 'Cơ sở lưu trữ'} · {reservation.rentalMonths} tháng · Tiền cọc:{' '}
            <strong className="text-brand-700 font-bold">
              {formatVND(reservation.totalPayable || reservation.depositAmount)}
            </strong>
          </p>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCancel?.(reservation)}
          className="text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5 mr-1" />
          Hủy đơn
        </Button>

        <Link to={bookingUrl}>
          <Button
            variant="primary"
            size="sm"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Thanh toán VietQR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
