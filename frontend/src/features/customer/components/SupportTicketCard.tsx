import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { 
  KeyRound, 
  Wrench, 
  CreditCard, 
  Package, 
  HelpCircle, 
  ChevronRight,
  XCircle
} from 'lucide-react';
import type { SupportTicket, SupportCategory, SupportStatus } from '../types';

export interface SupportTicketCardProps {
  ticket: SupportTicket;
  onViewDetail: (ticket: SupportTicket) => void;
  onCancel?: (ticket: SupportTicket) => void;
}

export const getCategoryMeta = (cat: SupportCategory) => {
  switch (cat) {
    case 'LOCK_ACCESS':
      return {
        label: 'Khóa & PIN',
        icon: KeyRound,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        iconColor: 'text-amber-600',
      };
    case 'UNIT_DAMAGE':
      return {
        label: 'Hư hỏng kho',
        icon: Wrench,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        iconColor: 'text-rose-600',
      };
    case 'PAYMENT':
      return {
        label: 'Thanh toán',
        icon: CreditCard,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
      };
    case 'BELONGINGS':
      return {
        label: 'Tài sản',
        icon: Package,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        iconColor: 'text-blue-600',
      };
    case 'OTHER':
    default:
      return {
        label: 'Khác',
        icon: HelpCircle,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        iconColor: 'text-slate-600',
      };
  }
};

export const getStatusMeta = (status: SupportStatus) => {
  switch (status) {
    case 'NEW':
      return { label: 'Mới gửi', variant: 'default' as const };
    case 'ASSIGNED':
      return { label: 'Đã phân công', variant: 'info' as const };
    case 'IN_PROGRESS':
      return { label: 'Đang xử lý', variant: 'warning' as const };
    case 'RESOLVED':
      return { label: 'Đã xử lý', variant: 'success' as const };
    case 'CLOSED':
      return { label: 'Đã đóng', variant: 'default' as const };
    case 'AUTO_CLOSED':
      return { label: 'Tự động đóng', variant: 'default' as const };
    default:
      return { label: status, variant: 'default' as const };
  }
};

export const SupportTicketCard: React.FC<SupportTicketCardProps> = ({
  ticket,
  onViewDetail,
  onCancel,
}) => {
  const catMeta = getCategoryMeta(ticket.category);
  const statusMeta = getStatusMeta(ticket.status);
  const CategoryIcon = catMeta.icon;

  const formattedDate = new Date(ticket.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isClosedOrResolved =
    ticket.status === 'RESOLVED' ||
    ticket.status === 'CLOSED' ||
    ticket.status === 'AUTO_CLOSED';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border bg-white transition-all duration-150 hover:shadow-sm group ${
        isClosedOrResolved
          ? 'border-slate-200 opacity-75'
          : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      {/* Category Icon */}
      <div className={`p-2 rounded-lg border shrink-0 ${catMeta.color}`}>
        <CategoryIcon className="w-3.5 h-3.5" />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
            {ticket.ticketCode}
          </span>
          <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
          {ticket.unitNumber && (
            <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
              Kho {ticket.unitNumber}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
          {ticket.title || ticket.description} · {formattedDate}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {ticket.status === 'NEW' && onCancel && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(ticket);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
            title="Hủy yêu cầu"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Hủy yêu cầu</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onViewDetail(ticket)}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors group-hover:gap-1.5"
        >
          Chi tiết
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
