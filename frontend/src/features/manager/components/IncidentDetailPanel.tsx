// frontend/src/features/manager/components/IncidentDetailPanel.tsx
import React from 'react';
import {
  Wrench,
  Clock,
  User,
  Phone,
  Mail,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { PriorityBadge } from './PriorityBadge';
import { ImageGallery } from './ImageGallery';

interface IncidentDetailPanelProps {
  ticket: ManagementSupportTicket;
  onAddAttachment?: () => void;
}

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({ ticket }) => {
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoStr;
    }
  };

  const initialImages = (ticket.attachments || []).map((a) => a.fileUrl);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header Panel */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-slate-900">
                #{ticket.code}
              </span>
              <PriorityBadge isUrgent={ticket.isUrgent} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Báo cáo lúc {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TypeBadge category={ticket.category} size="md" />
          <StatusBadge status={ticket.status} size="md" />
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Thông tin sự cố & Người báo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Box 1: Thông tin sự cố */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Thông tin tiếp nhận
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mã yêu cầu:</span>
                <span className="font-mono font-bold text-slate-800">{ticket.code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Loại vấn đề:</span>
                <span className="font-semibold text-slate-800">{ticket.categoryDisplayName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Thời hạn SLA:</span>
                <span className="font-semibold text-rose-600">
                  {ticket.slaDueAt ? formatDate(ticket.slaDueAt) : 'Trong vòng 4 giờ'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Yêu cầu di dời kho:</span>
                <span className={`font-bold ${ticket.relocationRequired ? 'text-amber-600' : 'text-slate-600'}`}>
                  {ticket.relocationRequired ? '⚠️ Cần chuyển ô kho' : 'Không'}
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Người báo cáo */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Người gửi yêu cầu
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-800">{ticket.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-semibold text-slate-800">
                  {ticket.customerPhone || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Vai trò:</span>
                <span className="font-medium text-slate-700">Khách thuê kho hiện hữu</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Kênh thông báo:</span>
                <span className="font-medium text-slate-700">Ứng dụng khách hàng SmartStorage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nội dung mô tả sự cố */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Mô tả sự cố từ khách hàng
          </h4>
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
            {ticket.description || 'Không có mô tả chi tiết từ người gửi.'}
          </div>
        </div>

        {/* Hình ảnh đính kèm hiện trường ban đầu */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              Hình ảnh hiện trường lúc báo sự cố ({initialImages.length})
            </h4>
          </div>
          {initialImages.length > 0 ? (
            <ImageGallery images={initialImages} title="Ảnh hiện trường ban đầu" />
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400">
              Khách hàng không đính kèm hình ảnh ban đầu
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
