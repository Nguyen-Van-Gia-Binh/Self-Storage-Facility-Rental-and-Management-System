import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  User,
  Phone,
  Building2,
  FileText,
  UserCheck,
  UserPlus,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRightLeft,
  AlertTriangle,
  ShieldCheck,
  ClipboardCheck,
  Receipt,
  Camera,
  ZoomIn,
} from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';

interface IncidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ManagementSupportTicket | null;
  onAssignClick: (ticket: ManagementSupportTicket) => void;
}

export interface ResolutionReportInfo {
  technicalNote: string;
  faultParty: 'COMPANY' | 'CUSTOMER' | 'NONE';
  faultPartyLabel: string;
  surchargesText?: string;
  totalCollected?: string;
  isPaidFully: boolean;
  relocationNote?: string;
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
  const isCompany =
    /l(ỗ|[\?o])i\s*do\s*c(ô|[\?o])ng\s*ty/i.test(note) ||
    /\[Tr.*ch nhi.*m:.*c.*ng ty.*\]/i.test(note);
  // Kiểm tra pattern phân định lỗi do khách hàng
  const isCustomer =
    /l(ỗ|[\?o])i\s*do\s*kh(á|[\?a])ch\s*h(à|[\?a])ng/i.test(note) ||
    /\[Tr.*ch nhi.*m:.*kh.*ch h.*ng.*\]/i.test(note);

  let faultParty: 'COMPANY' | 'CUSTOMER' | 'NONE' = 'NONE';
  let faultPartyLabel = 'Đã hoàn tất khắc phục';
  let surchargesText: string | undefined;
  let totalCollected: string | undefined;
  let isPaidFully = false;
  let relocationNote: string | undefined;

  if (/di\s*d(ờ|[\?o])i/i.test(note)) {
    relocationNote = 'Sự cố nghiêm trọng không sửa tại chỗ được — Cần di dời sang ô kho khác cùng loại.';
  }

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
    relocationNote,
  };
}

const TIMELINE_STEPS = [
  { key: 'OPEN', label: '1. Tiếp nhận', desc: 'Ghi nhận sự cố' },
  { key: 'ASSIGNED', label: '2. Phân công', desc: 'Chỉ định nhân sự' },
  { key: 'IN_PROGRESS', label: '3. Hiện trường', desc: 'Đang xử lý' },
  { key: 'RESOLVED', label: '4. Hoàn tất', desc: 'Nghiệm thu đóng vé' },
];

const getStepIndex = (status: string): number => {
  switch (status) {
    case 'OPEN':
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

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onAssignClick,
}) => {
  const [activeImageZoom, setActiveImageZoom] = useState<string | null>(null);

  if (!isOpen || !ticket) return null;

  const currentStep = getStepIndex(ticket.status);
  const isResolvedOrClosed =
    ticket.status === 'RESOLVED' ||
    ticket.status === 'CLOSED' ||
    (ticket.status as string) === 'AUTO_CLOSED';
  const isInProgress = ticket.status === 'IN_PROGRESS';
  const isAssigned = ticket.status === 'ASSIGNED';
  const resInfo = parseResolutionNote(ticket.resolutionNotes);

  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'NEW':
      case 'OPEN':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700">
            Chờ tiếp nhận
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700">
            Đã phân công
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
            Đang xử lý tại hiện trường
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">
            Đã giải quyết xong
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
            Đã nghiệm thu & đóng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
            {ticket.statusDisplayName || ticket.status}
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{ticket.code}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo lúc: {new Date(ticket.createdAt).toLocaleString('vi-VN')} · {ticket.facilityName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* 1. THANH TIẾN TRÌNH 4 BƯỚC */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3.5 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
              <div
                className="absolute top-3.5 left-4 h-0.5 bg-emerald-500 transition-all duration-300 -z-0"
                style={{
                  width: `${(currentStep / (TIMELINE_STEPS.length - 1)) * 92}%`,
                }}
              />

              {TIMELINE_STEPS.map((step, idx) => {
                const isPassed = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all ${
                        isPassed
                          ? 'bg-emerald-500 text-white ring-2 ring-emerald-200'
                          : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 font-bold ${
                        isCurrent
                          ? 'text-blue-700'
                          : isPassed
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CẢNH BÁO DI DỜI KHO (NẾU CÓ CỜ RELOCATION_REQUIRED) */}
          {ticket.relocationRequired && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wide">
                  ⚠️ Cảnh báo: Sự cố nghiêm trọng cần di dời ô kho
                </h4>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Nhân viên kỹ thuật báo ô kho này bị hư hại nghiêm trọng không thể khắc phục tại chỗ. Quản lý cơ sở cần chuẩn bị phương án đổi sang ô kho cùng loại cho khách thuê tại phân hệ <strong>Giám sát hợp đồng</strong>.
                </p>
              </div>
            </div>
          )}

          {/* 3. THÔNG TIN KHÁCH HÀNG & Ô KHO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer info */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Thông tin Khách hàng
              </span>
              <p className="font-bold text-slate-900 text-sm">{ticket.customerName}</p>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{ticket.customerPhone}</span>
              </div>
            </div>

            {/* Storage Unit info */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Vị trí Ô kho & Hợp đồng
              </span>
              <p className="font-bold text-slate-900 text-sm">
                Ô kho: <span className="text-blue-600 font-mono">{ticket.storageUnitCode}</span>
              </p>
              <p className="text-slate-500">
                Hợp đồng: <span className="font-mono text-slate-700">{ticket.contractCode || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* 4. PHÂN LOẠI & MÔ TẢ SỰ CỐ BAN ĐẦU */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                Phân loại & Nội dung sự cố
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                {ticket.categoryDisplayName}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-white leading-relaxed text-slate-800 text-xs shadow-inner">
              {ticket.description}
            </div>
          </div>

          {/* 5. ẢNH HIỆN TRƯỜNG DO KHÁCH GỬI */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Hình ảnh hiện trạng ban đầu ({ticket.attachments.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.attachments.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setActiveImageZoom(att.fileUrl)}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden aspect-video bg-slate-100 flex items-center justify-center hover:shadow-md transition-all cursor-pointer text-left"
                  >
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-semibold">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Xem phóng to</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 6. THÔNG TIN PHÂN CÔNG & NHÂN VIÊN PHỤ TRÁCH (THEO TRẠNG THÁI) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Nhân viên Cơ sở Phụ trách
              </span>
              {ticket.assignedStaffId ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  {isInProgress ? 'Đang tại hiện trường' : isResolvedOrClosed ? 'Đã nghiệm thu' : 'Đã phân công'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold">
                  Chưa phân công
                </span>
              )}
            </div>

            {ticket.assignedStaffId ? (
              <div className="space-y-1.5 text-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>
                    Kỹ thuật viên: <strong className="text-slate-900">{ticket.assignedStaffName}</strong>
                  </p>
                  {ticket.assignedStaffPhone && (
                    <a
                      href={`tel:${ticket.assignedStaffPhone}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{ticket.assignedStaffPhone}</span>
                    </a>
                  )}
                </div>

                {ticket.assignmentNotes && (
                  <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                    Chỉ đạo của Quản lý: "{ticket.assignmentNotes}"
                  </p>
                )}

                {isAssigned && (
                  <p className="text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                    ℹ️ Nhân viên đã được giao việc trong ca trực. Đang chờ nhân viên tiếp nhận và di chuyển tới hiện trường.
                  </p>
                )}

                {isInProgress && (
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span>Nhân viên đang trực tiếp kiểm tra và tiến hành khắc phục sự cố tại hiện trường.</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-slate-500 italic">
                  Chưa có nhân viên trực ca nào được giao xử lý ticket này.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAssignClick(ticket);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Phân công ngay</span>
                </button>
              </div>
            )}
          </div>

          {/* 7. BIÊN BẢN NGHIỆM THU & KHẮC PHỤC SỰ CỐ (DÀNH CHO VÉ ĐÃ XỬ LÝ HOẶC ĐÃ ĐÓNG) */}
          {isResolvedOrClosed && (
            <div className="rounded-2xl border border-emerald-200 bg-linear-to-b from-emerald-50/70 to-white overflow-hidden shadow-xs space-y-4 p-5 animate-in fade-in duration-200">
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
                      Báo cáo chính thức từ nhân viên kỹ thuật (SCR-FS-05 / BR-SUP-02)
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
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    resInfo.faultParty === 'COMPANY'
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : resInfo.faultParty === 'CUSTOMER'
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
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
                            : 'Đã hoàn tất xử lý theo tiêu chuẩn'}
                        </p>
                        <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                          {resInfo.faultParty === 'COMPANY'
                            ? 'Theo quy định BR-SUP-02, 100% chi phí kiểm tra và linh kiện do công ty chi trả. Khách hàng được miễn phí 0 đ.'
                            : resInfo.faultParty === 'CUSTOMER'
                            ? 'Sự cố phát sinh từ thao tác của khách hàng. Phụ phí vật tư/thay thế được áp dụng theo biểu phí BOM niêm yết.'
                            : 'Nhân viên kỹ thuật cơ sở đã trực tiếp kiểm tra và nghiệm thu hoạt động bình thường.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 2: Phụ phí & Thanh toán */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                    resInfo.faultParty === 'COMPANY'
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-sky-50/80 border-sky-300'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Chi phí phát sinh & Thanh toán
                    </span>
                    <div className="flex items-start gap-2">
                      <Receipt className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 w-full">
                        {resInfo.faultParty === 'COMPANY' ? (
                          <>
                            <p className="font-bold text-xs text-emerald-900">
                              Khách hàng miễn phí 0 đ (Bảo hành 100%)
                            </p>
                            <p className="text-[11px] text-emerald-700 leading-snug">
                              Toàn bộ phụ phí phát sinh được hạch toán vào chi phí bảo dưỡng vận hành của cơ sở.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs text-slate-800">
                              <span className="font-medium text-slate-600">Phụ phí BOM: </span>
                              <strong className="text-slate-900">
                                {resInfo.surchargesText || 'Không phát sinh phụ phí'}
                              </strong>
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[11px] font-medium text-slate-600">Tổng thu:</span>
                              <span className="font-mono font-extrabold text-sm text-sky-950">
                                {resInfo.totalCollected || '0 đ'}
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-sky-200/80 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-[11px] font-bold text-emerald-800">
                                Đã xác nhận thanh toán đầy đủ 100% tại hiện trường
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông tin di dời ô kho nếu có */}
              {(ticket.relocationRequired || resInfo.relocationNote) && (
                <div className="p-3 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <strong className="block text-amber-900">Phương án ô kho:</strong>
                    <span>
                      {resInfo.relocationNote ||
                        'Sự cố hư hại nghiêm trọng — Đã kích hoạt phương án di dời sang ô kho khác cùng loại.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Nội dung kỹ thuật xử lý */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Biện pháp kỹ thuật & Thao tác khắc phục
                </span>
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-white text-slate-800 leading-relaxed text-xs">
                  {resInfo.technicalNote}
                </div>
              </div>

              {/* Ảnh nghiệm thu thực tế của nhân viên */}
              {ticket.resolutionAttachments && ticket.resolutionAttachments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-emerald-200/80">
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Ảnh nghiệm thu sau khi sửa chữa ({ticket.resolutionAttachments.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ticket.resolutionAttachments.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => setActiveImageZoom(att.fileUrl)}
                        className="group relative rounded-xl border border-emerald-200 overflow-hidden aspect-video bg-emerald-50/50 flex items-center justify-center hover:shadow-md transition-all cursor-pointer text-left"
                      >
                        <img
                          src={att.fileUrl}
                          alt={att.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-semibold">
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Xem phóng to</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {/* CHỈ HIỂN THỊ NÚT PHÂN CÔNG / ĐIỀU CHUYỂN KHI VÉ CHƯA HOÀN TẤT */}
          {!isResolvedOrClosed && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onAssignClick(ticket);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                ticket.assignedStaffId
                  ? 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {ticket.assignedStaffId ? (
                <>
                  <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                  <span>Điều chuyển nhân viên</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Phân công nhân viên</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Lightbox phóng to ảnh */}
      {activeImageZoom && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveImageZoom(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActiveImageZoom(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-2 cursor-pointer flex items-center gap-1 text-xs font-semibold"
            >
              <X className="w-5 h-5" /> Đóng
            </button>
            <img
              src={activeImageZoom}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
