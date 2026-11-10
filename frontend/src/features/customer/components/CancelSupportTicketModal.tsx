import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCw } from 'lucide-react';

export interface CancelSupportTicketModalProps {
  isOpen: boolean;
  ticketCode?: string | null;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * CancelSupportTicketModal — Modal xác nhận hủy yêu cầu hỗ trợ dùng chung
 * giữa SupportPage và SupportTicketDetailModal.
 */
export const CancelSupportTicketModal: React.FC<CancelSupportTicketModalProps> = ({
  isOpen,
  ticketCode,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
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
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="flex items-start gap-3 p-3.5 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-xs leading-relaxed text-left">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-900 mb-1">
              Bạn có chắc chắn muốn hủy vé hỗ trợ {ticketCode}?
            </p>
            <p className="text-rose-700">
              Thao tác này sẽ đóng yêu cầu hỗ trợ và nhân viên cơ sở sẽ không tiếp tục xử lý sự cố này nữa.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-rose-600 font-semibold text-left">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Quay lại
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
          >
            {isSubmitting ? (
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
  );
};

