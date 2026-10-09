// frontend/src/features/manager/components/CloseIncidentModal.tsx
import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import type { ManagementSupportTicket } from '../types/staffAssignment';

interface CloseIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: ManagementSupportTicket;
  faultType?: 'COMPANY' | 'CUSTOMER';
  surchargeAmount?: number;
  onConfirmClose: (notes: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const CloseIncidentModal: React.FC<CloseIncidentModalProps> = ({
  isOpen,
  onClose,
  ticket,
  faultType = 'COMPANY',
  surchargeAmount = 0,
  onConfirmClose,
  isSubmitting = false,
}) => {
  const [closingNotes, setClosingNotes] = useState<string>(
    'Đã kiểm tra hoàn tất, thiết bị hoạt động bình thường, khách hàng đã ký xác nhận biên bản.'
  );

  if (!isOpen) return null;

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Xác nhận Nghiệm thu & Đóng sự cố
              </h3>
              <p className="text-xs text-slate-500">Mã ticket: #{ticket.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Ô kho phát sinh:</span>
              <span className="font-bold text-slate-900">{ticket.storageUnitCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-semibold text-slate-900">{ticket.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phân định trách nhiệm:</span>
              <span className={`font-bold ${faultType === 'COMPANY' ? 'text-brand-600' : 'text-amber-600'}`}>
                {faultType === 'COMPANY' ? 'Lỗi công ty (Cơ sở chịu chi phí)' : 'Lỗi khách hàng'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-600 font-medium">Phụ phí thu khách:</span>
              <span className="font-bold text-slate-900">{fmt(surchargeAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú biên bản đóng ticket:
            </label>
            <textarea
              rows={3}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-emerald-800 text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>
              Sau khi đóng sự cố, hệ thống sẽ lưu trữ biên bản nghiệm thu vĩnh viễn và gửi thông báo hoàn tất đến ứng dụng của khách hàng.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onConfirmClose(closingNotes)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Đang đóng...' : 'Xác nhận đóng sự cố'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
