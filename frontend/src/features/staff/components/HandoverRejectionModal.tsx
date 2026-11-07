import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertOctagon, X, ShieldAlert, ArrowRight, RefreshCw, XCircle } from 'lucide-react';
import type { CheckInContract } from '../../../types';
import { Button } from '../../../components/ui/Button';

export type HandoverRejectionAction = 'RELOCATE' | 'TERMINATE_REFUND';

export interface HandoverRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: CheckInContract;
  onConfirmRejection: (reason: string, reportedDefects: string, action: HandoverRejectionAction) => Promise<void>;
  isSubmitting?: boolean;
}

const REJECTION_REASONS = [
  'Ô kho bị ẩm ướt / dột nước từ trần kho',
  'Cửa cuốn / khóa cơ bị kẹt, hư hỏng cơ học không mở được',
  'Bàn phím số hoặc khóa thông minh bị lỗi kỹ thuật',
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
  const [action, setAction] = useState<HandoverRejectionAction>('RELOCATE');

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmRejection(selectedReason, reportedDefects, action);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          action === 'RELOCATE' ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-red-600 to-rose-700'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Báo Cáo Sự Cố Bàn Giao</h3>
              <p className="text-xs text-amber-100 font-medium">Khóa bảo trì ô cũ & Chọn hướng xử lý tiếp đón</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Đối tượng sự cố */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[11px] block">Khách hàng:</span>
              <span className="font-bold text-slate-900">{contract.customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">Ô kho phát sinh sự cố:</span>
              <span className="font-mono font-extrabold text-red-700 text-sm">{contract.storageUnitCode}</span>
            </div>
          </div>

          {/* Hướng xử lý tiếp đón (2 nhánh nghiệp vụ) */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Hướng xử lý tiếp đón khách hàng:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  action === 'RELOCATE'
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 shadow-xs ring-2 ring-amber-400/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="rejectionAction"
                    value="RELOCATE"
                    checked={action === 'RELOCATE'}
                    onChange={() => setAction('RELOCATE')}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold block flex items-center gap-1 text-xs">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600 inline shrink-0" />
                      Đổi ô kho mới
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-1">
                      Khách đồng ý nhận ô khác cùng loại. Giữ hợp đồng và gửi Quản lý (FM) đổi trên sơ đồ 2D.
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  action === 'TERMINATE_REFUND'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 shadow-xs ring-2 ring-rose-400/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="rejectionAction"
                    value="TERMINATE_REFUND"
                    checked={action === 'TERMINATE_REFUND'}
                    onChange={() => setAction('TERMINATE_REFUND')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold block flex items-center gap-1 text-xs">
                      <XCircle className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />
                      Hủy & Hoàn 100%
                    </span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-1">
                      Khách không muốn đổi. Chấm dứt hợp đồng ngày hôm nay và hoàn trả 100% tiền cọc + thuê.
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Chọn nguyên nhân */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              2. Nguyên nhân sự cố / hư hỏng tại chỗ:
            </label>

            <div className="space-y-1.5">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-slate-800 bg-slate-50 text-slate-900 font-medium'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="text-slate-800 focus:ring-slate-700 w-3.5 h-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              3. Mô tả chi tiết hiện trạng thực tế:
            </label>
            <textarea
              rows={2}
              value={reportedDefects}
              onChange={(e) => setReportedDefects(e.target.value)}
              placeholder="Ghi nhận cụ thể tình trạng lỗi (VD: nước dột góc trần phía sau)..."
              className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
            />
          </div>

          {/* Cảnh báo hệ quả quy trình */}
          <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
            action === 'RELOCATE' ? 'bg-amber-50/80 border-amber-200 text-amber-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{action === 'RELOCATE' ? 'Quy trình đổi ô kho tại quầy:' : 'Quy trình hủy & quyết toán hoàn tiền:'}</span>
            </div>
            <ul className="space-y-1 pl-4 list-disc leading-relaxed">
              <li>Ô kho <strong className="font-mono">{contract.storageUnitCode}</strong> lập tức khóa sang trạng thái <strong>Bảo trì</strong>.</li>
              {action === 'RELOCATE' ? (
                <>
                  <li>Hợp đồng giữ trạng thái <strong>Chờ nhận kho</strong> và tạo ticket sự cố khẩn cấp.</li>
                  <li>Nhân viên hướng dẫn khách chờ trong giây lát. Quản lý (FM) vào <strong>Quản lý hợp đồng</strong> chọn ô mới trên sơ đồ 2D.</li>
                  <li>Màn hình check-in sẽ tự động cập nhật ô mới sau khi Quản lý hoàn tất.</li>
                </>
              ) : (
                <>
                  <li>Hợp đồng chuyển trạng thái <strong>Đã chấm dứt</strong> với ngày kết thúc là hôm nay.</li>
                  <li>Quản lý (FM) sẽ phê duyệt lệnh hoàn tiền 100% (cọc + tiền thuê) cho khách hàng trong 3 ngày làm việc.</li>
                </>
              )}
            </ul>
          </div>

          {/* Nút thao tác */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Hủy bỏ / Quay lại
            </button>

            <Button
              type="submit"
              variant={action === 'RELOCATE' ? 'primary' : 'danger'}
              size="md"
              isLoading={isSubmitting}
              className="px-5 py-2 text-xs font-bold shadow-xs cursor-pointer"
            >
              <span>{action === 'RELOCATE' ? 'Xác nhận gửi FM đổi ô mới' : 'Xác nhận hủy & Hoàn cọc 100%'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
