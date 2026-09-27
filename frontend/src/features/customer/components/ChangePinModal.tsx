import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';
import { updateContractPin } from '@/api/customerRentals';
import type { RentedContract } from '../types';

export interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract | null;
  onPinChanged: (contractId: string, newPin: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  contract,
  onPinChanged,
}) => {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen || !contract) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setError(null);
      setNewPin('');
      setConfirmPin('');
      setIsSuccess(false);
    }, 180);
  };

  const validate = (): boolean => {
    const pinRegex = /^\d{4,6}$/;
    if (!pinRegex.test(newPin)) {
      setError('Mã PIN bắt buộc phải gồm từ 4 đến 6 chữ số (0-9).');
      return false;
    }

    const weakPins = ['0000', '1234', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '123456', '000000'];
    if (weakPins.includes(newPin)) {
      setError('Mã PIN quá đơn giản và dễ đoán. Vui lòng chọn một dãy số ngẫu nhiên hơn.');
      return false;
    }

    if (newPin !== confirmPin) {
      setError('Mã PIN xác nhận không khớp. Vui lòng kiểm tra lại.');
      return false;
    }

    if (contract.accessPin && newPin === contract.accessPin) {
      setError('Mã PIN mới không được trùng với mã PIN hiện hành.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await updateContractPin({
        contractId: contract.id,
        newPin,
      });

      setIsSuccess(true);
      setIsSubmitting(false);
      onPinChanged(contract.id, newPin);

      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err) {
      console.error('Lỗi đổi mã PIN:', err);
      setError('Không thể cập nhật mã PIN. Vui lòng thử lại sau.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d6050] to-[#14937a] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1">
            <KeyRound className="w-4 h-4" />
            <span>Bảo Mật Khóa Điện Tử</span>
          </div>

          <h3 className="text-xl font-black text-white">Đổi Mã PIN Mở Cửa Ngăn {contract.unitNumber}</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">{contract.facilityName}</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Current PIN Alert */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Lock className="w-4 h-4 text-brand-600" />
              <span>Mã PIN hiện hành:</span>
            </div>
            <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
              {contract.accessPin ? `${contract.accessPin.slice(0, 2)}••` : '••••'}
            </span>
          </div>

          {/* New PIN Inputs */}
          <div className="space-y-3">
            <div className="relative">
              <Input
                label="Mã PIN mới (4 - 6 số)"
                type={showNewPin ? 'text' : 'password'}
                placeholder="Ví dụ: 7892"
                maxLength={6}
                value={newPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNewPin(val);
                  if (error) setError(null);
                }}
                className="font-mono text-center text-lg tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <Input
                label="Xác nhận lại mã PIN mới"
                type={showNewPin ? 'text' : 'password'}
                placeholder="Nhập lại mã PIN trên"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setConfirmPin(val);
                  if (error) setError(null);
                }}
                className="font-mono text-center text-lg tracking-widest"
                required
              />
            </div>
          </div>

          {/* Validation Error */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">Đổi mã PIN thành công! Đang lưu thông tin...</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              Mã PIN mới sẽ có hiệu lực ngay lập tức tại bàn phím số ô kho và đầu đọc cổng vào cơ sở. Tuyệt đối không chia sẻ mã này cho người lạ.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting || isSuccess}
              className="px-4 cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || isSuccess || !newPin || !confirmPin}
              className="px-5 font-bold cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu mã PIN mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
