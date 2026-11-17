import React from 'react';
import { Loader2, X } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: React.ReactNode;
  note?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'warning' | 'info';
  icon?: 'lock' | 'unlock' | 'alert' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_BUTTON_STYLES: Record<'danger' | 'success' | 'warning' | 'info', string> = {
  danger: 'bg-rose-600 hover:bg-rose-700 text-white focus-visible:ring-rose-500/30',
  success: 'bg-brand-600 hover:bg-brand-700 text-white focus-visible:ring-brand-500/30',
  warning: 'bg-amber-600 hover:bg-amber-700 text-white focus-visible:ring-amber-500/30',
  info: 'bg-brand-600 hover:bg-brand-700 text-white focus-visible:ring-brand-500/30',
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  note,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'info',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const buttonStyle = CONFIRM_BUTTON_STYLES[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? undefined : onCancel}
      showBackdrop
      className="!rounded-lg !shadow-xl !border-gray-200 max-w-md w-full"
    >
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">
          <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900 leading-snug">
            {title}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Đóng hộp thoại"
            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-2.5">
          {description && (
            <div className="text-sm text-gray-700 leading-relaxed">{description}</div>
          )}
          {note && (
            <p className="text-xs text-gray-500 leading-relaxed">{note}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-gray-50/70 border-t border-gray-200 rounded-b-lg">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${buttonStyle}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
