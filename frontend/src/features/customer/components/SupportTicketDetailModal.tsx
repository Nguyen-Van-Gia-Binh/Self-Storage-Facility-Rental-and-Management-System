import React, { useState } from 'react';
import { UrgentSlaLabel } from '@/components/UrgentSlaLabel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  X, 
  Clock, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Phone, 
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import type { SupportTicket, SupportStatus } from '../types';
import { getCategoryMeta, getStatusMeta } from './SupportTicketCard';

export interface SupportTicketDetailModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmResolution: (id: number, satisfied: boolean, feedbackNotes?: string) => Promise<void>;
  onCancelTicket?: (id: number) => Promise<void>;
}

const TIMELINE_STEPS: { key: SupportStatus; label: string; desc: string }[] = [
  { key: 'NEW', label: '1. Tiếp nhận', desc: 'Hệ thống ghi nhận vé' },
  { key: 'ASSIGNED', label: '2. Phân công', desc: 'Điều phối nhân sự' },
  { key: 'IN_PROGRESS', label: '3. Xử lý tại chỗ', desc: 'Kiểm tra & sửa chữa' },
  { key: 'RESOLVED', label: '4. Nghiệm thu', desc: 'Khách hàng đánh giá' },
  { key: 'CLOSED', label: '5. Hoàn tất', desc: 'Đóng yêu cầu' },
];

const getStepIndex = (status: SupportStatus): number => {
  switch (status) {
    case 'NEW':
      return 0;
    case 'ASSIGNED':
      return 1;
    case 'IN_PROGRESS':
      return 2;
    case 'RESOLVED':
      return 3;
    case 'CLOSED':
    case 'AUTO_CLOSED':
      return 4;
    default:
      return 0;
  }
};

export const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirmResolution,
  onCancelTicket,
}) => {
  const [feedbackNote, setFeedbackNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const catMeta = getCategoryMeta(ticket.category);
  const statusMeta = getStatusMeta(ticket.status);
  const currentStep = getStepIndex(ticket.status);

  const handleAction = async (satisfied: boolean) => {
    try {
      setSubmitting(true);
      await onConfirmResolution(ticket.id, satisfied, feedbackNote);
      setFeedbackNote('');
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu hỗ trợ sự cố này?')) return;
    try {
      setSubmitting(true);
      if (onCancelTicket) {
        await onCancelTicket(ticket.id);
      }
      onClose();
    } catch {
      // Handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${catMeta.color}`}>
              <catMeta.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-slate-800 tracking-wide">
                  {ticket.ticketCode}
                </span>
                <Badge variant={statusMeta.variant}>
                  {statusMeta.label}
                </Badge>
                {ticket.isUrgent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3 h-3" />
                    <UrgentSlaLabel lead="SLA xử lý" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh mục: <strong className="text-slate-700">{catMeta.label}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
          {/* Status Timeline Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Tiến trình xử lý vé (SLA & Timeline)
              </span>
              <span className="text-[11px] text-slate-500">
                Cập nhật lần cuối: {new Date(ticket.updatedAt || ticket.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="text-center">
                    <div 
                      className={`h-2 rounded-full mb-1.5 transition-all ${
                        isPassed
                          ? 'bg-emerald-500'
                          : isCurrent
                          ? 'bg-brand-600 ring-2 ring-brand-200'
                          : 'bg-slate-200'
                      }`} 
                    />
                    <p className={`text-[11px] font-bold truncate ${
                      isCurrent ? 'text-brand-700' : isPassed ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-[9px] text-slate-400 hidden sm:block truncate">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unit & Facility Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand-600" />
                Cơ sở & Ô kho liên quan
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {ticket.unitNumber ? `Ô kho: ${ticket.unitNumber}` : 'Khu vực chung của cơ sở'}
              </p>
              <p className="text-xs text-slate-600">
                {ticket.facilityName}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                <FileText className="w-3 h-3 text-brand-600" />
                Hợp đồng & Người yêu cầu
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {ticket.contractNumber || (ticket.contractId ? `Mã HĐ: #${ticket.contractId}` : 'Khách hàng vãng lai')}
              </p>
              <p className="text-xs text-slate-600">
                Khách hàng: <strong>{ticket.customerName || 'Bạn'}</strong> ({ticket.customerPhone || '0988 776 655'})
              </p>
            </div>
          </div>

          {/* Problem Description */}
          <div className="space-y-2">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
              Mô tả chi tiết sự cố
            </h5>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 leading-relaxed text-xs sm:text-sm">
              {ticket.title && (
                <div className="font-bold text-slate-900 pb-2 mb-2 border-b border-slate-200">
                  {ticket.title}
                </div>
              )}
              {ticket.description}
            </div>
          </div>

          {/* Attachments from Customer */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                Hình ảnh minh chứng sự cố ({ticket.attachments.length} ảnh)
              </h5>
              <div className="flex flex-wrap gap-3">
                {ticket.attachments.map((att) => (
                  <div 
                    key={att.id}
                    onClick={() => setActiveImageZoom(att.fileUrl)}
                    className="group relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden cursor-pointer bg-slate-100 hover:ring-2 hover:ring-brand-400 transition-all"
                  >
                    <img 
                      src={att.fileUrl} 
                      alt="Ảnh sự cố" 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.customerNotice && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1">
                Thông báo từ cơ sở
              </p>
              {ticket.customerNotice}
            </div>
          )}

          {/* Assigned Staff Card */}
          {ticket.assignedStaffName && (
            <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                    Nhân viên cơ sở phụ trách xử lý
                  </span>
                  <p className="text-sm font-extrabold text-slate-900">
                    {ticket.assignedStaffName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Trực ban tại quầy Staff Desk (Facility Staff)
                  </p>
                </div>
              </div>

              {ticket.assignedStaffPhone && (
                <a
                  href={`tel:${ticket.assignedStaffPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-sky-600" />
                  <span>{ticket.assignedStaffPhone}</span>
                </a>
              )}
            </div>
          )}

          {/* Staff Resolution Section (RESOLVED or CLOSED) */}
          {(ticket.resolutionNote || (ticket.resolutionAttachments && ticket.resolutionAttachments.length > 0)) && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Kết quả xử lý từ nhân viên kỹ thuật (UC-F7-08)
                </span>
                {ticket.resolvedAt && (
                  <span className="text-[11px] text-emerald-700">
                    Xong lúc: {new Date(ticket.resolvedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>

              {ticket.resolutionNote && (
                <div className="p-3 bg-white rounded-lg border border-emerald-200/80 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {ticket.resolutionNote}
                </div>
              )}

              {ticket.resolutionAttachments && ticket.resolutionAttachments.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-emerald-800 mb-1.5">
                    Ảnh hiện trường sau khi nghiệm thu sửa chữa:
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {ticket.resolutionAttachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={() => setActiveImageZoom(att.fileUrl)}
                        className="group relative w-20 h-20 rounded-lg border border-emerald-200 overflow-hidden cursor-pointer bg-slate-100 hover:ring-2 hover:ring-emerald-400 transition-all"
                      >
                        <img
                          src={att.fileUrl}
                          alt="Ảnh nghiệm thu"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ticket.autoCloseDeadline && ticket.status === 'RESOLVED' && (
                <p className="text-[11px] text-emerald-700 italic flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Nếu không có phản hồi thêm, vé sẽ tự động hoàn tất trước ngày:{' '}
                  <strong>{new Date(ticket.autoCloseDeadline).toLocaleDateString('vi-VN')}</strong>.
                </p>
              )}
            </div>
          )}

          {/* Action form for Customer if RESOLVED (US-SC-06.3) */}
          {ticket.status === 'RESOLVED' && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
              <h5 className="font-extrabold text-amber-900 text-xs sm:text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Xác nhận nghiệm thu dịch vụ
              </h5>
              <p className="text-xs text-amber-800 leading-relaxed">
                Vui lòng xác nhận sự cố tại ô kho của bạn đã được giải quyết triệt để. Bạn có thể để lại phản hồi hoặc yêu cầu nhân viên kiểm tra lại.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ghi chú đánh giá / Ý kiến đóng góp (tùy chọn):
                </label>
                <textarea
                  rows={2}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra mở cửa êm ái, rất cảm ơn bạn nhân viên..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleAction(false)}
                  className="border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Báo chưa khắc phục triệt để
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  onClick={() => handleAction(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-xs font-bold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Xác nhận hài lòng & Đóng vé
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {ticket.status === 'NEW' && onCancelTicket && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleCancel}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors"
              >
                Hủy yêu cầu hỗ trợ này
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Đóng cửa sổ
          </Button>
        </div>

        {/* Lightbox Image Zoom Modal */}
        {activeImageZoom && (
          <div 
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveImageZoom(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img 
                src={activeImageZoom} 
                alt="Zoom ảnh" 
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
              />
              <button
                type="button"
                onClick={() => setActiveImageZoom(null)}
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
