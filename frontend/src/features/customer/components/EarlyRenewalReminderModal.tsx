import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  X,
  Calendar,
  Box,
  Tag,
} from 'lucide-react';
import type { RentedContract } from '../types';
import { calculateDaysRemaining } from '../utils/renewalPricing';

export interface EarlyRenewalReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  noticeDays?: number;
  reminderDays?: number[];
}

export const EarlyRenewalReminderModal: React.FC<EarlyRenewalReminderModalProps> = ({
  isOpen,
  onClose,
  contract,
  noticeDays = 0,
  reminderDays = [],
}) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen || !contract) return null;

  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const daysUntilCutoff = Math.max(0, daysRemaining - noticeDays);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200 overflow-hidden transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header with Warm Amber Accent */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 px-6 pt-7 pb-6 text-white overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-extrabold tracking-wide uppercase">
              <Clock className="w-3.5 h-3.5" />
              Đề xuất gia hạn giữ ô kho
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            {daysUntilCutoff === 0
              ? 'Hôm nay là ngày cuối cùng gia hạn!'
              : `Chỉ còn ${daysUntilCutoff} ngày nữa sẽ khóa gia hạn!`}
          </h2>

          <p className="text-xs sm:text-sm text-amber-100 mt-1 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 shrink-0" />
            <span>Ô kho <strong>{contract.unitNumber}</strong> · {contract.facilityName}</span>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Timeline Summary Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-amber-900/80 block">Hết hạn hợp đồng:</span>
              <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                {contract.endDate}
              </span>
              <span className="text-[10px] text-slate-500">Còn {daysRemaining} ngày sử dụng</span>
            </div>

            <div className="border-l border-amber-200 pl-3">
              <span className="text-[11px] font-semibold text-amber-900/80 block">Thời hạn chót gia hạn:</span>
              <span className="text-sm font-black text-rose-600 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                Còn {daysUntilCutoff} ngày
              </span>
              <span className="text-[10px] text-rose-700 font-medium">Nhắc trước ngày hết {noticeDays} ngày</span>
            </div>
          </div>

          {/* Explanation Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Chính sách đang hiệu lực nhắc gia hạn trước ngày hết hạn <strong>{noticeDays} ngày</strong>
              {reminderDays.length > 0 ? <>, các mốc nhắc là <strong>{reminderDays.join(', ')}</strong> ngày</> : null}
              . Nút gia hạn vẫn dùng được khi ô kho chưa có người khác đặt trước.
            </p>
          </div>

          {/* Key Advantages */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Quyền lợi khi gia hạn ngay:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-100">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Giữ nguyên ngăn & mã PIN</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-sky-50 text-sky-900 border border-sky-100">
                <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-semibold">Bảo lưu 100% tiền cọc</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-100 col-span-1 sm:col-span-2">
                <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Chiết khấu <strong>5% (6 tháng)</strong> và <strong>10% (12 tháng)</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="w-full sm:w-auto text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Để tôi xem sau
          </Button>

          <Link
            to={`/customer/renew/${contract.id}`}
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            <Button
              variant="primary"
              size="sm"
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <span>Gia hạn ngay để giữ chỗ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
};
