import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { executeDoubleDepositCompensation } from '@/api/contract';
import type { EmergencyCompensationResponse } from '@/types';

function formatVND(amount?: number | null): string {
  if (amount == null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

export interface EmergencyCompensationModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: {
    id: number;
    code: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    facilityName: string;
    unitTypeName: string;
    totalRentalFee?: number;
    depositAmount?: number;
    monthlyPrice?: number;
    rentalMonths?: number;
  };
  onSuccess: (response: EmergencyCompensationResponse) => void;
}

export const EmergencyCompensationModal: React.FC<EmergencyCompensationModalProps> = ({
  isOpen,
  onClose,
  contract,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tính toán số tiền bồi thường
  const rentFee = contract.totalRentalFee || (contract.monthlyPrice ? contract.monthlyPrice * (contract.rentalMonths || 1) : 0);
  const deposit = contract.depositAmount || contract.monthlyPrice || 0;
  const penalty = deposit; // 100% cọc gốc
  const totalPayout = rentFee + deposit + penalty; // Tiền thuê + 2 x Cọc

  const [reason, setReason] = useState(
    'Cơ sở cháy kho 100% không còn ô cùng loại hoặc lớn hơn để bàn giao theo chính sách BR-BMP-02 (Căn cứ Điều 328 Bộ luật Dân sự 2015)'
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do giải trình bồi thường khẩn cấp.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await executeDoubleDepositCompensation(contract.id, {
        reason: reason.trim(),
      });
      if (res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Kích hoạt bồi thường thất bại.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kích hoạt bồi thường thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-rose-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header viền đỏ cảnh báo mức độ cao nhất */}
        <div className="shrink-0 px-6 py-4 border-b border-rose-100 bg-rose-50/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-600 text-white">
                  Cấp 3 — Bồi thường Vi phạm
                </span>
                <span className="text-xs font-semibold text-rose-700 font-mono">
                  BR-BMP-02
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mt-1">
                Duyệt Quyết toán &amp; Kích hoạt Bồi thường Phạt cọc Gấp đôi
              </h3>
              <p className="text-xs text-rose-800 mt-0.5 font-medium">
                Căn cứ Điều 328 Bộ luật Dân sự 2015 &amp; Chính sách BR-BMP-02 về vi phạm nghĩa vụ bàn giao mặt bằng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body cuộn mượt mà */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Card thông tin hợp đồng */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs sm:text-sm space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-gray-500">Mã hợp đồng:</span>
              <span className="font-bold font-mono text-gray-900">{contract.code}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Khách hàng:</span>
              <span className="font-semibold text-gray-800">
                {contract.customerName} ({contract.customerPhone})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Cơ sở &amp; Hạng kho:</span>
              <span className="font-medium text-gray-800">
                {contract.facilityName} · {contract.unitTypeName}
              </span>
            </div>
          </div>

          {/* Bảng phân rã tài chính chi tiết theo Điều 328 BLDS */}
          <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-rose-600" />
              Bảng kê Quyết toán Chi hoàn &amp; Phạt cọc
            </h4>

            <div className="space-y-2 text-xs sm:text-sm divide-y divide-rose-100">
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-600">1. Tiền thuê đã thanh toán (Hoàn 100%):</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {formatVND(rentFee)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600">2. Tiền cọc gốc ban đầu (Hoàn 100%):</span>
                <span className="font-semibold text-gray-900 tabular-nums">
                  {formatVND(deposit)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 text-rose-700">
                <span className="font-semibold">3. Tiền phạt cọc vi phạm hợp đồng (100% cọc):</span>
                <span className="font-bold tabular-nums">
                  + {formatVND(penalty)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 text-sm sm:text-base border-t-2 border-rose-300">
                <div>
                  <span className="font-bold text-gray-900 block">
                    TỔNG HOÀN TRẢ KHÁCH HÀNG:
                  </span>
                  <span className="text-[11px] text-rose-800 font-medium">
                    (GẤP ĐÔI tiền cọc + Hoàn đủ 100% tiền thuê)
                  </span>
                </div>
                <span className="font-black text-rose-700 text-lg tabular-nums">
                  {formatVND(totalPayout)}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-rose-200 flex items-center gap-2 text-[11px] text-rose-800">
              <Clock className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>
                Thời hạn giải ngân: Chuyển khoản hoàn tất trong <strong>3 ngày làm việc</strong> (Bộ phận Kế toán).
              </span>
            </div>
          </div>

          {/* Ô nhập lý do giải trình */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Lý do giải trình bồi thường khẩn cấp <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-colors"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chi tiết..."
              required
            />
            <p className="text-[11px] text-gray-500">
              Lý do này sẽ được ghi nhận vào Biên bản bồi thường A4 và thông báo trực tiếp đến khách hàng.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý bồi thường...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Duyệt Quyết toán &amp; Bồi thường (Điều 328 BLDS)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
