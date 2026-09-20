import React from 'react';
import { CheckCircle2, FileText, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReturnSuccessModalProps {
  isOpen: boolean;
  contractCode: string;
  unitCode: string;
  customerName: string;
  refundAmount: number;
  onClose: () => void;
}

export const ReturnSuccessModal: React.FC<ReturnSuccessModalProps> = ({
  isOpen,
  contractCode,
  unitCode,
  customerName,
  refundAmount,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Nghiệm thu trả kho hoàn tất!</h2>
          <p className="text-sm text-slate-500">
            Biên bản kiểm tra hiện trạng đã được nộp thành công và chuyển đến Facility Manager để phê duyệt quyết toán.
          </p>
        </div>

        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Mã hợp đồng:</span>
            <span className="font-semibold text-slate-800 font-mono">{contractCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Ô kho hoàn trả:</span>
            <span className="font-semibold text-slate-800 font-mono">{unitCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Khách hàng:</span>
            <span className="font-semibold text-slate-800">{customerName}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="font-medium text-slate-700">Dự kiến hoàn cọc:</span>
            <span className="font-mono font-bold text-teal-600 text-base">
              {refundAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Lưu ý quy trình sau nghiệm thu:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-teal-700 pl-1">
            <li>Mã mở cửa của khách đã được vô hiệu hóa tức thì (BR-RET-09).</li>
            <li>Ô kho chuyển sang trạng thái <b>CLEANING</b> chờ dọn dẹp.</li>
            <li>Tiền cọc sẽ được chuyển khoản về tài khoản gốc trong <b>7 ngày làm việc</b> (BR-RET-05).</li>
          </ul>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/staff');
            }}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium bg-teal-600 text-white hover:bg-teal-700 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Home className="w-4 h-4" /> Về tổng quan ca trực
          </button>
        </div>
      </div>
    </div>
  );
};
