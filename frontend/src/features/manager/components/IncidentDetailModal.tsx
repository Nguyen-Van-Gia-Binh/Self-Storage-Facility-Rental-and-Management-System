import React from 'react';
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
  ExternalLink,
} from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';

interface IncidentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ManagementSupportTicket | null;
  onAssignClick: (ticket: ManagementSupportTicket) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  onAssignClick,
}) => {
  if (!isOpen || !ticket) return null;

  const getStatusBadge = () => {
    switch (ticket.status) {
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
            {ticket.status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{ticket.code}</h3>
                {ticket.isUrgent && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Khẩn cấp SLA 2h
                  </span>
                )}
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Info Cards Grid */}
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
                Vị trí Ô kho
              </span>
              <p className="font-bold text-slate-900 text-sm">
                Ô kho: <span className="text-blue-600 font-mono">{ticket.storageUnitCode}</span>
              </p>
              <p className="text-slate-500">
                Hợp đồng: <span className="font-mono text-slate-700">{ticket.contractCode || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Description & Category */}
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

          {/* Customer Attachments (Photos) */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                Hình ảnh hiện trường do khách hàng gửi ({ticket.attachments.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative rounded-xl border border-slate-200 overflow-hidden aspect-video bg-slate-100 flex items-center justify-center hover:shadow-md transition-all"
                  >
                    <img
                      src={att.fileUrl}
                      alt={att.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-[11px] font-semibold">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Xem phóng to</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Staff & Assignment Notes */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Nhân viên Cơ sở Phụ trách
              </span>
              {ticket.assignedStaffId ? (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                  Đã chỉ định
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-semibold">
                  Chưa phân công
                </span>
              )}
            </div>

            {ticket.assignedStaffId ? (
              <div className="space-y-1 text-slate-700">
                <p>
                  Nhân viên: <strong className="text-slate-900">{ticket.assignedStaffName}</strong>
                </p>
                {ticket.assignmentNotes && (
                  <p className="text-slate-600 italic">
                    Chỉ đạo của Quản lý: "{ticket.assignmentNotes}"
                  </p>
                )}
                {ticket.slaDueAt && (
                  <p className="text-slate-500 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Hạn cam kết SLA: {new Date(ticket.slaDueAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
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
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Phân công ngay</span>
                </button>
              </div>
            )}
          </div>

          {/* Resolution Details if any */}
          {ticket.status === 'RESOLVED' && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kết quả & Biên bản Giải quyết Sự cố
              </span>
              <p className="text-emerald-900 leading-relaxed">
                {ticket.resolutionNotes || 'Đã kiểm tra và xử lý xong tại hiện trường.'}
              </p>
              {ticket.resolvedAt && (
                <p className="text-[11px] text-emerald-700">
                  Hoàn thành lúc: {new Date(ticket.resolvedAt).toLocaleString('vi-VN')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onAssignClick(ticket);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{ticket.assignedStaffId ? 'Điều chuyển nhân viên' : 'Phân công nhân viên'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
