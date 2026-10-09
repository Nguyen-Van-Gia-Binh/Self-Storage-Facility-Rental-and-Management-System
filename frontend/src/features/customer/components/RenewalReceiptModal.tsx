import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  CheckCircle2, 
  X, 
  Printer, 
  Calendar, 
  KeyRound, 
  Building2, 
  Box, 
  ShieldCheck, 
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatVND } from '../utils/pricing';
import type { RentedContract } from '../types';

interface RenewalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: RentedContract;
  renewalMonths: number;
  newEndDate: string;
  totalPaid: number;
  receiptNumber: string;
  renewedAt?: string;
  onBackToDashboard: () => void;
}

export const RenewalReceiptModal: React.FC<RenewalReceiptModalProps> = ({
  isOpen,
  onClose,
  contract,
  renewalMonths,
  newEndDate,
  totalPaid,
  receiptNumber,
  renewedAt = new Date().toLocaleString('vi-VN'),
  onBackToDashboard,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        ref={printRef}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider block">
                Xác nhận thành công
              </span>
              <h2 className="text-lg font-extrabold tracking-tight">
                Biên Lai Gia Hạn Hợp Đồng
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Receipt Info Bar */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Mã biên lai:</span>
              <strong className="text-[#0a1614] font-mono text-sm">{receiptNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Thời gian giao dịch:</span>
              <span className="text-slate-700 font-semibold">{renewedAt}</span>
            </div>
          </div>

          {/* Unit & Contract Details */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Thông tin ô kho & Hợp đồng
            </h3>
            <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-brand-600" />
                  Mã ô kho:
                </span>
                <span className="font-extrabold text-base text-[#0a1614]">
                  {contract.unitNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-brand-600" />
                  Cơ sở lưu trữ:
                </span>
                <span className="font-semibold text-slate-800">
                  {contract.facilityName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mã hợp đồng:</span>
                <span className="font-mono text-slate-800 font-semibold">
                  #{contract.contractNumber}
                </span>
              </div>
            </div>
          </div>

          {/* New Expiry Date Card */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Thời hạn hợp đồng mới
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                +{renewalMonths} tháng sử dụng
              </span>
            </div>
            <div className="pt-1 flex items-baseline justify-between">
              <span className="text-xs text-slate-600">Ngày kết thúc mới:</span>
              <span className="text-lg font-black text-emerald-700">
                {newEndDate}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/90 leading-tight">
              Hợp đồng của bạn đã được chuyển về trạng thái <strong>ACTIVE (Có hiệu lực)</strong> liên tục mà không bị gián đoạn.
            </p>
          </div>

          {/* Access PIN Preserved Card (BR-REN-08) */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex items-start gap-3">
            <div className="p-2 bg-sky-100 rounded-lg text-sky-700 flex-shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950">
                  Bảo lưu mã PIN mở tủ
                </span>
                {contract.accessPin && (
                  <span className="font-mono font-black text-sm px-2 py-0.5 bg-white border border-sky-300 rounded text-sky-900">
                    {contract.accessPin}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-sky-800">
                Mã khóa điện tử và thẻ ra vào cổng cơ sở tiếp tục hoạt động bình thường, quý khách không cần cấp đổi lại.
              </p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between text-slate-600 text-xs">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                Hình thức thanh toán:
              </span>
              <span className="font-semibold text-slate-800">VietQR · Napas247</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 text-xs">
              <span>Tiền cọc bảo lưu:</span>
              <span className="font-semibold text-emerald-600">{formatVND(contract.depositHeld)} (Giữ nguyên)</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm">
              <span className="font-bold text-[#0a1614]">Tổng tiền đã thanh toán:</span>
              <span className="text-base font-extrabold text-brand-600">
                {formatVND(totalPaid)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Biên lai điện tử có giá trị pháp lý tương đương hóa đơn thanh toán trực tiếp tại quầy.</span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In biên lai</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onBackToDashboard}
            className="flex items-center gap-1.5 text-xs px-5 shadow-xs"
          >
            <span>Về Quản lý kho của tôi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
