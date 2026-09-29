import React from 'react';
import { Lock, Unlock, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'info';
  icon?: 'lock' | 'unlock' | 'alert' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG = {
  danger: {
    icon: Lock,
    bg: 'bg-rose-50 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700',
  },
  success: {
    icon: Unlock,
    bg: 'bg-emerald-50 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'info',
  icon = 'info',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const config = VARIANT_CONFIG[variant];
  const IconComponent = {
    lock: Lock,
    unlock: Unlock,
    alert: AlertCircle,
    info: Info,
  }[icon];

  return (
    <Modal isOpen={isOpen} showBackdrop>
      <div className="p-6 space-y-4 max-w-sm w-full">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {description && (
              <p className="text-xs text-slate-500 mt-1 font-mono">{description}</p>
            )}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-slate-600">{description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 ${config.button}`}
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
