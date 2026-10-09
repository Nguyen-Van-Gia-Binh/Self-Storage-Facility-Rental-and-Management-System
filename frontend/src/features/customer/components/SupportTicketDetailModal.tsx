import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { 
  X, 
  Clock, 
  MapPin, 
  FileText, 
  UserCheck, 
  Phone, 
  Image as ImageIcon,
  MessageSquare,
  ExternalLink,
  ClipboardCheck,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Camera,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import type { SupportTicket, SupportStatus } from '../types';
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
  const isCompany = /l(ỗ|[\?o])i\s*do\s*c(ô|[\?o])ng\s*ty/i.test(note) || /\[Tr.*ch nhi.*m:.*c.*ng ty.*\]/i.test(note);
  // Kiểm tra pattern phân định lỗi do khách hàng
  const isCustomer = /l(ỗ|[\?o])i\s*do\s*kh(á|[\?a])ch\s*h(à|[\?a])ng/i.test(note) || /\[Tr.*ch nhi.*m:.*kh.*ch h.*ng.*\]/i.test(note);

  let faultParty: 'COMPANY' | 'CUSTOMER' | 'NONE' = 'NONE';
  let faultPartyLabel = 'Đã hoàn tất khắc phục';
  let surchargesText: string | undefined;
  let totalCollected: string | undefined;
  let isPaidFully = false;

  // Lọc sạch technicalNote bằng cách bỏ block [...] cuối cùng nếu có
  let technicalNote = note.replace(/\[\s*Tr[^\]]+\]/gi, '').trim();

  if (isCompany) {
    faultParty = 'COMPANY';
    faultPartyLabel = 'Lỗi do phía công ty / thiết bị cơ sở (BR-SUP-02)';
    totalCollected = '0 đ (Miễn phí 100%)';
    isPaidFully = true;
  } else if (isCustomer) {
    faultParty = 'CUSTOMER';
    faultPartyLabel = 'Lỗi phát sinh do phía khách hàng';

    // Bóc tách Phụ phí
    const feeMatch = note.match(/Ph[ụ\?u]\s*ph[í\?i]:\s*([^|\]]+)/i);
    if (feeMatch) {
      surchargesText = feeMatch[1].trim();
    }

    // Bóc tách Tổng thu
    const totalMatch = note.match(/T[ổ\?o]ng\s*thu:\s*([^|\]]+)/i);
    if (totalMatch) {
      totalCollected = totalMatch[1].trim();
    }

    // Bóc tách xác nhận thanh toán
    if (/thanh\s*to[á\?a]n/i.test(note)) {
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

const TIMELINE_STEPS: { key: SupportStatus; label: string; desc: string }[] = [
  { key: 'NEW', label: '1. Tiếp nhận', desc: 'Hệ thống ghi nhận vé' },
  { key: 'ASSIGNED', label: '2. Phân công', desc: 'Điều phối nhân viên' },
  { key: 'IN_PROGRESS', label: '3. Xử lý hiện trường', desc: 'Kiểm tra & khắc phục' },
  { key: 'CLOSED', label: '4. Hoàn tất', desc: 'Nghiệm thu & đóng vé' },
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
    case 'CLOSED':
    case 'AUTO_CLOSED':
      return 3;
    default:
      return 0;
  }
};

export const SupportTicketDetailModal: React.FC<SupportTicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onCancelTicket,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const catMeta = getCategoryMeta(ticket.category);
  const statusMeta = getStatusMeta(ticket.status);
  const currentStep = getStepIndex(ticket.status);
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

            <div className="grid grid-cols-4 gap-2">
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

          {/* BIÊN BẢN NGHIỆM THU & KẾT QUẢ KHẮC PHỤC SỰ CỐ (Dành cho vé đã xử lý xong hoặc đã đóng) */}
          {isResolved && (
            <div className="rounded-2xl border border-emerald-200 bg-linear-to-b from-emerald-50/70 to-white overflow-hidden shadow-xs space-y-4 p-5">
              {/* Header biên bản */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-emerald-200/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ClipboardCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-emerald-950 text-sm tracking-wide uppercase">
                      Biên bản nghiệm thu & Khắc phục sự cố
                    </h5>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Ghi nhận chính thức từ nhân viên kỹ thuật cơ sở (US-FS-05.2)
                    </p>
                  </div>
                </div>

                {ticket.resolvedAt && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Nghiệm thu: {new Date(ticket.resolvedAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>

              {/* Phân định trách nhiệm & Chi phí phụ phí */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Box 1: Trách nhiệm lỗi */}
                <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  resInfo.faultParty === 'COMPANY'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : resInfo.faultParty === 'CUSTOMER'
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Phân định trách nhiệm sự cố
                    </span>
                    <div className="flex items-start gap-2">
                      {resInfo.faultParty === 'COMPANY' ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : resInfo.faultParty === 'CUSTOMER' ? (
                        <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-extrabold text-xs sm:text-sm">
                          {resInfo.faultParty === 'COMPANY'
                            ? 'Lỗi do thiết bị / Cơ sở (Phía Công ty)'
                            : resInfo.faultParty === 'CUSTOMER'
                            ? 'Lỗi phát sinh do quá trình khách hàng sử dụng'
                            : 'Đã hoàn tất xử lý theo quy trình vận hành'}
                        </p>
                        <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                          {resInfo.faultParty === 'COMPANY'
                            ? 'Theo quy định BR-SUP-02, 100% chi phí kiểm tra và linh kiện do công ty chi trả. Khách hàng không phải chịu bất kỳ khoản phí nào.'
                            : resInfo.faultParty === 'CUSTOMER'
                            ? 'Sự cố phát sinh từ thao tác sử dụng của khách hàng. Các phụ phí vật tư/thay thế được áp dụng theo biểu phí BOM niêm yết.'
                            : 'Nhân viên kỹ thuật cơ sở đã trực tiếp đến kiểm tra, sửa chữa và nghiệm thu hoạt động bình thường.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 2: Phụ phí & Thanh toán */}
                <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  resInfo.faultParty === 'COMPANY'
                    ? 'bg-emerald-50/80 border-emerald-300'
                    : resInfo.faultParty === 'CUSTOMER'
                    ? 'bg-sky-50/80 border-sky-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Chi phí & Tình trạng thanh toán
                    </span>
                    <div className="flex items-start gap-2">
                      <Receipt className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 w-full">
                        {resInfo.faultParty === 'COMPANY' ? (
                          <>
                            <p className="font-extrabold text-xs sm:text-sm text-emerald-900">
                              Khách hàng: Miễn phí hoàn toàn (0 đ)
                            </p>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Công ty chi trả 100%
                            </span>
                          </>
                        ) : resInfo.faultParty === 'CUSTOMER' ? (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Phụ phí phát sinh:</span>
                              <strong className="text-slate-800 font-bold">{resInfo.surchargesText || 'Theo biểu phí BOM'}</strong>
                            </div>
                            {resInfo.totalCollected && (
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-sky-200/60">
                                <span className="text-slate-600">Tổng thu phụ phí:</span>
                                <strong className="text-sky-900 font-mono font-black text-sm">{resInfo.totalCollected}</strong>
                              </div>
                            )}
                            <div className="pt-1.5">
                              {resInfo.isPaidFully ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" /> Khách hàng đã thanh toán 100% tại hiện trường
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  Đã xác nhận biên bản
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-extrabold text-xs sm:text-sm text-slate-800">
                              Chi phí sửa chữa: Đã hoàn tất
                            </p>
                            <span className="text-[11px] text-slate-500 block">
                              Không ghi nhận khoản phụ phí ngoài danh mục.
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chi tiết nội dung xử lý của nhân viên kỹ thuật */}
              <div className="p-3.5 rounded-xl bg-white border border-emerald-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Nội dung khắc phục & Biện pháp kỹ thuật
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line bg-slate-50/70 p-2.5 rounded-lg border border-slate-200/60">
                  {resInfo.technicalNote}
                </p>
              </div>

              {/* Ảnh hiện trường sau khi nghiệm thu */}
              {ticket.resolutionAttachments && ticket.resolutionAttachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    Hình ảnh hiện trường sau khi nghiệm thu ({ticket.resolutionAttachments.length} ảnh):
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {ticket.resolutionAttachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={() => setActiveImageZoom(att.fileUrl)}
                        className="group relative w-20 h-20 rounded-xl border border-emerald-200 overflow-hidden cursor-pointer bg-slate-100 hover:ring-2 hover:ring-emerald-400 transition-all shadow-xs"
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
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

          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs cursor-pointer"
          >
            Đóng cửa sổ
          </Button>
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
                className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Xác nhận Hủy Yêu Cầu Hỗ Trợ từ Modal Chi Tiết (ISS-79) */}
        <Modal
          isOpen={showCancelConfirm}
          onClose={() => {
            if (!submitting) setShowCancelConfirm(false);
          }}
          className="max-w-md w-full"
        >
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Xác nhận hủy yêu cầu hỗ trợ
              </h3>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowCancelConfirm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-xs leading-relaxed text-left">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 mb-1">
                  Bạn có chắc chắn muốn hủy vé hỗ trợ {ticket.ticketCode}?
                </p>
                <p className="text-rose-700">
                  Thao tác này sẽ đóng yêu cầu hỗ trợ và nhân viên cơ sở sẽ không tiếp tục xử lý sự cố này nữa.
                </p>
              </div>
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 font-semibold text-left">{cancelError}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setShowCancelConfirm(false)}
                className="text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Quay lại (Giữ vé)
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={submitting}
                onClick={handleConfirmCancel}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RotateCw className="w-4 h-4 mr-1.5 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  'Xác nhận hủy vé'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>,
    document.body
  );
};
