import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { RentedContract } from '../types';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { formatDateVN } from '../utils/unitPickerHelpers';

export interface EarlyRenewalReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  noticeDays?: number;
  reminderDays?: number[];
}

function subtractDaysISO(dateStr: string, days: number): string {
  const clean = (dateStr || '').slice(0, 10);
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return clean;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() - Math.max(0, days));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const EarlyRenewalReminderModal: React.FC<EarlyRenewalReminderModalProps> = ({
  isOpen,
  onClose,
  contract,
  noticeDays = 20,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen || !contract) return null;

  const lockDays = noticeDays > 0 ? noticeDays : 20;
  const daysRemaining = calculateDaysRemaining(contract.endDate);
  const isSelfRenewalLocked = daysRemaining <= lockDays;
  const daysUntilCutoff = Math.max(0, daysRemaining - lockDays);
  const cutoffDateStr = subtractDaysISO(contract.endDate, lockDays);

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
      aria-labelledby="early-renewal-modal-title"
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header — Nền trắng sạch, đường kẻ mảnh dưới chân */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2
                id="early-renewal-modal-title"
                className="text-base font-bold text-slate-900 leading-snug"
              >
                {isSelfRenewalLocked
                  ? 'Đã hết thời hạn ưu tiên gia hạn trực tuyến'
                  : 'Sắp hết hạn ưu tiên giữ ô kho'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Ô kho: <strong className="font-semibold text-slate-800">{contract.unitNumber}</strong>
                {contract.facilityName ? ` • ${contract.facilityName}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — Khối mốc thời gian trung tính & danh sách quyền lợi gọn */}
        <div className="px-6 py-5 space-y-5 text-sm text-slate-700">
          <div className="rounded-xl bg-slate-50/70 border border-slate-200 p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Hết hạn hợp đồng</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatDateVN(contract.endDate)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-slate-200/80">
              <span className="text-xs text-slate-500">Hạn chót gia hạn ưu tiên</span>
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatDateVN(cutoffDateStr)}
              </span>
            </div>

            <p
              className={`text-xs font-medium pt-1 ${
                isSelfRenewalLocked ? 'text-rose-600' : 'text-amber-700'
              }`}
            >
              {isSelfRenewalLocked
                ? `Hợp đồng còn ${Math.max(0, daysRemaining)} ngày — vui lòng liên hệ cơ sở để hỗ trợ gia hạn ngoại lệ.`
                : `Chỉ còn ${daysUntilCutoff} ngày — Nhắc trước ngày hết hạn hợp đồng ${lockDays} ngày.`}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-900">
              Quyền lợi khi gia hạn ngay:
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giữ nguyên vị trí ô kho &amp; mã PIN hiện tại.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bảo lưu 100% số tiền cọc đang gửi.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer — Hotline dạng text link bên trái, 2 nút hành động căn phải */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Cần hỗ trợ? Gọi Hotline:{' '}
            <a
              href="tel:19002026"
              className="font-semibold text-slate-800 hover:text-brand-600 hover:underline underline-offset-2 tabular-nums"
            >
              1900 2026
            </a>
          </p>

          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Để tôi xem sau
            </button>

            {isSelfRenewalLocked ? (
              <a
                href="tel:19002026"
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Liên hệ hỗ trợ
              </a>
            ) : (
              <Link
                to={`/customer/renew/${contract.id}`}
                onClick={handleClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Gia hạn ngay
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
