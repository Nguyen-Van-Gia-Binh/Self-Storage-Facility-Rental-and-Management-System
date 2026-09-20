import React, { useState } from 'react';
import { AlertOctagon, X, ShieldAlert, ArrowRight } from 'lucide-react';
import type { CheckInContract } from '../../../types';
import { Button } from '../../../components/ui/Button';

export interface HandoverRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: CheckInContract;
  onConfirmRejection: (reason: string, reportedDefects: string) => Promise<void>;
  isSubmitting?: boolean;
}

const REJECTION_REASONS = [
  'Ô kho bị ẩm ướt / dột nước từ trần kho',
  'Cửa cuốn / khóa cơ bị kẹt, hư hỏng cơ học không mở được',
  'Bàn phím số IoT hoặc khóa thông minh bị lỗi kỹ thuật',
  'Khách hàng thay đổi nhu cầu cá nhân, không đồng ý nhận kho',
  'Lý do kỹ thuật hoặc sự cố mặt bằng khác...',
];

export const HandoverRejectionModal: React.FC<HandoverRejectionModalProps> = ({
  isOpen,
  onClose,
  contract,
  onConfirmRejection,
  isSubmitting = false,
}) => {
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [reportedDefects, setReportedDefects] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmRejection(selectedReason, reportedDefects);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header cảnh báo */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Báo Cáo Sự Cố & Khóa Bảo Trì</h3>
              <p className="text-xs text-red-100 font-mono">Modal ngoại lệ SCR-FS-02.1 • Quy tắc BR-CHK-06</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Đối tượng sự cố */}
          <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Khách hàng:</span>
              <span className="font-bold text-slate-900">{contract.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Ô kho phát sinh sự cố:</span>
              <span className="font-mono font-extrabold text-red-700 text-sm">{contract.storageUnitCode}</span>
            </div>
          </div>

          {/* Chọn nguyên nhân */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Chọn nguyên nhân từ chối / phát sinh hư hỏng:
            </label>

            <div className="space-y-1.5">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-red-500 bg-red-50 text-red-900 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              2. Mô tả chi tiết khi kiểm tra thực địa:
            </label>
            <textarea
              rows={3}
              value={reportedDefects}
              onChange={(e) => setReportedDefects(e.target.value)}
              placeholder="Ghi nhận cụ thể tình trạng lỗi để bộ phận kỹ thuật tiếp nhận sửa chữa..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>

          {/* Cảnh báo hệ quả tự động BR-CHK-06 */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5 text-[11px]">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              Quy trình xử lý tự động theo quy định BR-CHK-06:
            </div>
            <ul className="space-y-1 pl-4 list-disc text-amber-800/90 leading-relaxed">
              <li>Ô kho <strong className="font-mono">{contract.storageUnitCode}</strong> lập tức chuyển sang trạng thái <strong>MAINTENANCE</strong> (Bảo trì) và bị khóa trên sơ đồ.</li>
              <li>Lượt bàn giao này bị hủy; Hợp đồng chuyển sang <strong>TERMINATED</strong>.</li>
              <li>Hệ thống gửi phiếu yêu cầu cho Quản lý cơ sở (FM) thực hiện <strong>hoàn trả 100% (cọc + tiền thuê)</strong> cho khách trong vòng 3 ngày làm việc.</li>
            </ul>
          </div>

          {/* Nút thao tác */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ / Quay lại
            </button>

            <Button
              type="submit"
              variant="danger"
              size="md"
              isLoading={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
            >
              <span>Xác nhận khóa bảo trì</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
