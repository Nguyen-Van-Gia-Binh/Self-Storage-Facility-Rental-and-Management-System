import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hooks/useScrollLock';
import { Button } from '@/components/ui/Button';
import { CancelSupportTicketModal } from './CancelSupportTicketModal';
import { 
  X, 
  Phone, 
  ExternalLink,
} from 'lucide-react';
import type { SupportTicket } from '../types';
import { getCategoryMeta, getStatusMeta } from './SupportTicketCard';

export interface SupportTicketDetailModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmResolution?: (id: number, satisfied: boolean, feedbackNotes?: string) => Promise<void>;
  onCancelTicket?: (id: number) => Promise<void>;
}

export interface ResolutionReportInfo {
  technicalNote: string;
  faultParty: 'COMPANY' | 'CUSTOMER' | 'NONE';
  faultPartyLabel: string;
  surchargesText?: string;
  totalCollected?: string;
  isPaidFully: boolean;
}

export function parseResolutionNote(rawNote?: string): ResolutionReportInfo {
  if (!rawNote || !rawNote.trim()) {
    return {
      technicalNote: 'Sự cố đã được nhân viên cơ sở kiểm tra và xử lý hoàn tất tại hiện trường.',
      faultParty: 'NONE',
      faultPartyLabel: 'Đã hoàn tất khắc phục theo tiêu chuẩn vận hành',
      isPaidFully: true,
    };
  }

  const note = rawNote.trim();

  // Kiểm tra pattern phân định lỗi do công ty
  const isCompany = /l(ỗ|[?o])i\s*do\s*c(ô|[?o])ng\s*ty/i.test(note) || /\[Tr.*ch nhi.*m:.*c.*ng ty.*\]/i.test(note);
  // Kiểm tra pattern phân định lỗi do khách hàng
  const isCustomer = /l(ỗ|[?o])i\s*do\s*kh(á|[?a])ch\s*h(à|[?a])ng/i.test(note) || /\[Tr.*ch nhi.*m:.*kh.*ch h.*ng.*\]/i.test(note);

  let faultParty: 'COMPANY' | 'CUSTOMER' | 'NONE' = 'NONE';
  let faultPartyLabel = 'Đã hoàn tất khắc phục';
  let surchargesText: string | undefined;
  let totalCollected: string | undefined;
  let isPaidFully = false;

  // Lọc sạch technicalNote bằng cách bỏ block [...] cuối cùng nếu có
  let technicalNote = note.replace(/\[\s*Tr[^\]]+\]/gi, '').trim();

  if (isCompany) {
    faultParty = 'COMPANY';
    faultPartyLabel = 'Lỗi thiết bị / cơ sở (Phía Công ty)';
    totalCollected = '0 đ (Miễn phí 100%)';
    isPaidFully = true;
  } else if (isCustomer) {
    faultParty = 'CUSTOMER';
    faultPartyLabel = 'Lỗi phát sinh do phía khách hàng';

    // Bóc tách Phụ phí
    const feeMatch = note.match(/Ph[ụ?u]\s*ph[í?i]:\s*([^|\]]+)/i);
    if (feeMatch) {
      surchargesText = feeMatch[1].trim();
    }

    // Bóc tách Tổng thu
    const totalMatch = note.match(/T[ổ?o]ng\s*thu:\s*([^|\]]+)/i);
    if (totalMatch) {
      totalCollected = totalMatch[1].trim();
    }

    // Bóc tách xác nhận thanh toán
    if (/thanh\s*to[á?a]n/i.test(note)) {
      isPaidFully = true;
    }
  }

  if (!technicalNote) {
    technicalNote = 'Nhân viên kỹ thuật đã đến kiểm tra và hoàn thành xử lý sự cố tại hiện trường.';
  }

  return {
    technicalNote,
    faultParty,
    faultPartyLabel,
    surchargesText,
    totalCollected,
    isPaidFully,
  };
}

export const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onConfirmResolution,
  onCancelTicket,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeImageZoom) {
          setActiveImageZoom(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeImageZoom, onClose]);

  if (!isOpen || !ticket) return null;

  const catMeta = getCategoryMeta(ticket.category);
  const statusMeta = getStatusMeta(ticket.status);
  const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED' || ticket.status === 'AUTO_CLOSED' || Boolean(ticket.resolutionNote);
  const resInfo = parseResolutionNote(ticket.resolutionNote);

  const handleConfirmCancel = async () => {
    try {
      setSubmitting(true);
      setCancelError(null);
      if (onCancelTicket) {
        await onCancelTicket(ticket.id);
      }
      setShowCancelConfirm(false);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể hủy yêu cầu hỗ trợ. Vui lòng thử lại.';
      setCancelError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Phân cấp rõ ràng: Title H2, Subtitle metadata, Status badge góc phải) */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Chi tiết Yêu cầu Hỗ trợ
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{ticket.ticketCode}</span>
              <span>·</span>
              <span>{catMeta.label}</span>
              <span>·</span>
              <span>
                {new Date(ticket.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge trạng thái đặt góc phải */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                ticket.status === 'IN_PROGRESS'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : ticket.status === 'ASSIGNED'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : ticket.status === 'NEW'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  ticket.status === 'IN_PROGRESS'
                    ? 'bg-amber-500'
                    : ticket.status === 'ASSIGNED'
                    ? 'bg-blue-500'
                    : ticket.status === 'NEW'
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>{statusMeta.label}</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body (Làm phẳng, dùng border-b và whitespace thay vì Hộp lồng Hộp) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs sm:text-sm">
          {/* Section 1: Grid 2 cột (Cơ sở & Ô kho / Hợp đồng & Khách hàng) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Cơ sở & Ô kho
              </h4>
              <p className="font-semibold text-slate-900 text-sm">
                {ticket.unitNumber ? `Ô kho: ${ticket.unitNumber}` : 'Khu vực chung của cơ sở'}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {ticket.facilityName}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Hợp đồng & Khách hàng
              </h4>
              <p className="font-semibold text-slate-900 text-sm">
                {ticket.contractNumber || (ticket.contractId ? `Mã HĐ: #${ticket.contractId}` : 'Khách hàng vãng lai')}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {ticket.customerName || 'Bạn'} ({ticket.customerPhone || '0988 776 655'})
              </p>
            </div>
          </div>

          {/* Section 2: Mô tả chi tiết sự cố */}
          <div className="pb-6 border-b border-slate-100 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Mô tả chi tiết sự cố
            </h4>
            {ticket.title && (
              <p className="text-sm font-semibold text-slate-900 mb-1">
                {ticket.title}
              </p>
            )}
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {ticket.description}
            </p>

            {/* Attachments from Customer if any */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-3">
                <p className="text-xs text-slate-400 font-semibold mb-2">
                  Hình ảnh minh chứng ({ticket.attachments.length} ảnh):
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {ticket.attachments.map((att) => (
                    <div 
                      key={att.id}
                      onClick={() => setActiveImageZoom(att.fileUrl)}
                      className="group relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden cursor-pointer bg-slate-50 hover:ring-2 hover:ring-brand-400 transition-all"
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
          </div>

          {/* Customer Notice nếu có */}
          {ticket.customerNotice && (
            <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block mb-1">
                Thông báo từ cơ sở:
              </span>
              {ticket.customerNotice}
            </div>
          )}

          {/* Section 3: Nhân viên phụ trách (Dạng text phẳng + avatar nhỏ 24px) */}
          {ticket.assignedStaffName && (
            <div className="pb-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Nhân viên phụ trách:
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {ticket.assignedStaffName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {ticket.assignedStaffName}
                  </span>
                </div>
              </div>

              {ticket.assignedStaffPhone && (
                <a
                  href={`tel:${ticket.assignedStaffPhone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{ticket.assignedStaffPhone}</span>
                </a>
              )}
            </div>
          )}

          {/* Section 4: Biên bản nghiệm thu & Khắc phục (Nền xám nhạt bg-slate-50, không viền xanh rối mắt) */}
          {isResolved && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Biên bản nghiệm thu & Khắc phục
              </h4>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-200/70">
                  <span className="text-xs text-slate-500">
                    {ticket.resolvedAt 
                      ? `Thời gian: ${new Date(ticket.resolvedAt).toLocaleString('vi-VN')}`
                      : 'Đã hoàn tất xử lý'}
                  </span>
                  <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded">
                    {resInfo.faultParty === 'COMPANY'
                      ? 'Miễn phí (0 đ)'
                      : resInfo.totalCollected || 'Miễn phí (0 đ)'}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {resInfo.faultPartyLabel}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    <strong className="text-slate-700">Nội dung khắc phục:</strong> {resInfo.technicalNote}
                  </p>
                </div>

                {/* Ảnh nghiệm thu */}
                {ticket.resolutionAttachments && ticket.resolutionAttachments.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <p className="text-xs text-slate-500 mb-2">
                      Hình ảnh hiện trường sau khi nghiệm thu ({ticket.resolutionAttachments.length} ảnh):
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {ticket.resolutionAttachments.map((att) => (
                        <div
                          key={att.id}
                          onClick={() => setActiveImageZoom(att.fileUrl)}
                          className="group relative w-20 h-20 rounded-lg border border-slate-200 overflow-hidden cursor-pointer bg-white hover:ring-2 hover:ring-brand-400 transition-all shadow-2xs"
                        >
                          <img
                            src={att.fileUrl}
                            alt="Ảnh nghiệm thu"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ExternalLink className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            {ticket.status === 'NEW' && onCancelTicket && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setCancelError(null);
                  setShowCancelConfirm(true);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold transition-colors cursor-pointer"
              >
                Hủy yêu cầu hỗ trợ này
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {ticket.status === 'RESOLVED' && onConfirmResolution && (
              <>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    const notes = window.prompt('Vui lòng nhập lý do chưa hài lòng (để nhân viên xử lý tiếp):');
                    if (notes === null) return;
                    try {
                      setSubmitting(true);
                      await onConfirmResolution(ticket.id, false, notes.trim() || undefined);
                      onClose();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Chưa đạt (Yêu cầu làm lại)
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={async () => {
                    try {
                      setSubmitting(true);
                      await onConfirmResolution(ticket.id, true);
                      onClose();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Nghiệm thu & Đóng phiếu
                </button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Đóng cửa sổ
            </Button>
          </div>
        </div>

        {/* Lightbox Image Zoom Modal */}
        {activeImageZoom && (
          <div 
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
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
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Xác nhận Hủy Yêu Cầu Hỗ Trợ (dùng chung) */}
        <CancelSupportTicketModal
          isOpen={showCancelConfirm}
          ticketCode={ticket.ticketCode}
          isSubmitting={submitting}
          error={cancelError}
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </div>,
    document.body
  );
};
