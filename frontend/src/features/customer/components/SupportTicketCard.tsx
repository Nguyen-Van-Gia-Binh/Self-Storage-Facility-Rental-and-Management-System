import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  KeyRound, 
  Wrench, 
  CreditCard, 
  Package, 
  HelpCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  ChevronRight,
  FileImage,
  XCircle,
  Sparkles
} from 'lucide-react';
import type { SupportTicket, SupportCategory, SupportStatus } from '../types';

export interface SupportTicketCardProps {
  ticket: SupportTicket;
  onViewDetail: (ticket: SupportTicket) => void;
  onConfirmResolution?: (ticket: SupportTicket) => void;
  onCancel?: (ticket: SupportTicket) => void;
}

export const getCategoryMeta = (cat: SupportCategory) => {
  switch (cat) {
    case 'LOCK_ACCESS':
      return {
        label: 'Khóa & Truy cập',
        icon: KeyRound,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        iconColor: 'text-amber-600',
      };
    case 'UNIT_DAMAGE':
      return {
        label: 'Hư hỏng kho & Hạ tầng',
        icon: Wrench,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        iconColor: 'text-rose-600',
      };
    case 'PAYMENT':
      return {
        label: 'Thanh toán & Đặt cọc',
        icon: CreditCard,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        iconColor: 'text-emerald-600',
      };
    case 'BELONGINGS':
      return {
        label: 'Tài sản & Tiện ích',
        icon: Package,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        iconColor: 'text-blue-600',
      };
    case 'OTHER':
    default:
      return {
        label: 'Vấn đề khác',
        icon: HelpCircle,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        iconColor: 'text-slate-600',
      };
  }
};

export const getStatusMeta = (status: SupportStatus) => {
  switch (status) {
    case 'NEW':
      return {
        label: 'Mới gửi',
        variant: 'default' as const,
        description: 'Chờ nhân viên cơ sở tiếp nhận',
      };
    case 'ASSIGNED':
      return {
        label: 'Đã phân công',
        variant: 'info' as const,
        description: 'Đã giao cho nhân viên xử lý',
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang xử lý',
        variant: 'warning' as const,
        description: 'Nhân viên đang kiểm tra và khắc phục',
      };
    case 'RESOLVED':
      return {
        label: 'Đã xử lý xong',
        variant: 'success' as const,
        description: 'Chờ bạn nghiệm thu đóng vé',
      };
    case 'CLOSED':
      return {
        label: 'Đã đóng',
        variant: 'default' as const,
        description: 'Yêu cầu hỗ trợ đã hoàn tất',
      };
    case 'AUTO_CLOSED':
      return {
        label: 'Tự động đóng',
        variant: 'default' as const,
        description: 'Tự động đóng sau 7 ngày làm việc không có phản hồi',
      };
    default:
      return {
        label: status,
        variant: 'default' as const,
        description: '',
      };
  }
};

export const SupportTicketCard: React.FC<SupportTicketCardProps> = ({
  ticket,
  onViewDetail,
  onConfirmResolution,
  onCancel,
}) => {
  const catMeta = getCategoryMeta(ticket.category);
  const statusMeta = getStatusMeta(ticket.status);
  const CategoryIcon = catMeta.icon;

  const formattedDate = new Date(ticket.createdAt).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <Card 
      className={`p-5 transition-all duration-200 border rounded-2xl bg-white hover:shadow-md ${
        ticket.status === 'RESOLVED'
          ? 'border-emerald-300 ring-1 ring-emerald-100 bg-emerald-50/20'
          : ticket.isUrgent
          ? 'border-amber-300'
          : 'border-slate-200 hover:border-brand-300'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl border shrink-0 ${catMeta.color}`}>
            <CategoryIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-xs font-bold text-slate-800 tracking-wide">
                {ticket.ticketCode}
              </span>
              <Badge variant={statusMeta.variant}>
                {statusMeta.label}
              </Badge>
              {ticket.isUrgent && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3 h-3" />
                  Khẩn cấp
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Gửi lúc: {formattedDate}
            </p>
          </div>
        </div>

        {/* Location / Unit tag */}
        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-slate-800 block">
            {ticket.unitNumber ? `Kho ${ticket.unitNumber}` : 'Chung cơ sở'}
          </span>
          <span className="text-[11px] text-slate-500 block max-w-[140px] sm:max-w-[180px] truncate" title={ticket.facilityName}>
            {ticket.facilityName}
          </span>
        </div>
      </div>

      {/* Body: Description & Details */}
      <div className="py-3.5 space-y-2.5">
        {ticket.title && (
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
            {ticket.title}
          </h4>
        )}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>

        {/* Attachments indicators */}
        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
          {ticket.attachments && ticket.attachments.length > 0 && (
            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
              <FileImage className="w-3 h-3 text-brand-600" />
              {ticket.attachments.length} ảnh minh họa
            </span>
          )}

          {ticket.assignedStaffName && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <UserCheck className="w-3 h-3 text-brand-600" />
              Phụ trách: <strong className="text-slate-800">{ticket.assignedStaffName}</strong>
            </span>
          )}
        </div>

        {/* Callout if RESOLVED (US-SC-06.3) */}
        {ticket.status === 'RESOLVED' && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2 text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Nhân viên đã hoàn thành xử lý sự cố!</p>
                <p className="text-[11px] text-emerald-700 mt-0.5 line-clamp-1">
                  {ticket.resolutionNote || 'Vui lòng kiểm tra thực tế và xác nhận nghiệm thu đóng ticket.'}
                </p>
              </div>
            </div>
            {onConfirmResolution && (
              <Button
                variant="primary"
                size="sm"
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirmResolution(ticket);
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Nghiệm thu đóng vé
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div>
          {ticket.status === 'NEW' && onCancel && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCancel(ticket);
              }}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 transition-colors font-medium"
            >
              <XCircle className="w-3.5 h-3.5" />
              Hủy yêu cầu
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onViewDetail(ticket)}
          className="inline-flex items-center gap-1 font-bold text-brand-600 hover:text-brand-700 transition-colors ml-auto group"
        >
          <span>Xem chi tiết & Tiến trình</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </Card>
  );
};
