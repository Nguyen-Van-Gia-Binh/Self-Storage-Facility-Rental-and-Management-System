import React from 'react';
import {
  QrCode,
  CreditCard,
  Building2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatVND } from '../utils/pricing';

/**
 * Các khối presentational tách ra từ `VietQRPaymentModal` (UI/UX refactor).
 * Modal giữ toàn bộ state + effects (checkout, polling, sandbox, countdown);
 * đây chỉ là JSX thuần nhận props → dễ đọc, dễ review, không đổi hành vi.
 */

export type VietQRMethod = 'VIETQR' | 'CARD';

/* ------------------------------------------------------------------ */
/* 1. Thanh chọn phương thức thanh toán (VietQR / Thẻ)                 */
/* ------------------------------------------------------------------ */

export interface PaymentMethodSelectorProps {
  selected: VietQRMethod;
  onSelect: (method: VietQRMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selected,
  onSelect,
}) => (
  <div>
    <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
      Chọn phương thức thanh toán
    </label>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onSelect('VIETQR')}
        className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
          selected === 'VIETQR'
            ? 'border-brand-600 bg-brand-50/50 text-brand-900 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 text-slate-600'
        }`}
      >
        <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
          <QrCode className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-extrabold flex items-center gap-1">
            VietQR Napas247
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">0đ phí</span>
          </div>
          <div className="text-[11px] text-slate-500">Quét mã ngân hàng</div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('CARD')}
        className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
          selected === 'CARD'
            ? 'border-brand-600 bg-brand-50/50 text-brand-900 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 text-slate-600'
        }`}
      >
        <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-extrabold">Thẻ ATM / Quốc tế</div>
          <div className="text-[11px] text-slate-500">Visa, Mastercard, JCB</div>
        </div>
      </button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 2. Khối QR + thông tin chuyển khoản (4 dòng copy)                   */
/* ------------------------------------------------------------------ */

export interface VietQRTransferPanelProps {
  qrUrl: string;
  bankName: string;
  /** Số tài khoản HIỂN THỊ (constant), giữ đúng hành vi gốc của modal */
  bankAccountDisplay: string;
  /** Số tài khoản COPY (lấy từ lệnh checkout, fallback constant), giữ đúng hành vi gốc */
  bankAccountCopy: string;
  accountHolder: string;
  totalAmount: number;
  transferMemo: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}

export const VietQRTransferPanel: React.FC<VietQRTransferPanelProps> = ({
  qrUrl,
  bankName,
  bankAccountDisplay,
  bankAccountCopy,
  accountHolder,
  totalAmount,
  transferMemo,
  copiedField,
  onCopy,
}) => (
  <div className="space-y-4">
    <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
      {/* QR Code Container */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs relative group">
          <img
            src={qrUrl}
            alt="VietQR Napas247"
            className="w-44 h-44 object-contain rounded-lg"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded shadow">
              Napas247
            </span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1">
          <QrCode className="w-3.5 h-3.5 text-brand-600" />
          Quét bằng ứng dụng ngân hàng
        </span>
      </div>

      {/* Transfer Info Details */}
      <div className="w-full space-y-2.5 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block uppercase font-medium">Ngân hàng thụ hưởng</span>
          <span className="font-bold text-slate-800 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
            {bankName}
          </span>
        </div>

        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 block">Số tài khoản</span>
            <span className="font-mono text-sm font-black text-slate-900 tracking-wider">
              {bankAccountDisplay}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCopy(bankAccountCopy, 'account')}
            className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
          >
            {copiedField === 'account' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'account' ? 'Đã chép' : 'Chép'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 block">Chủ tài khoản</span>
            <span className="text-xs font-bold text-slate-800 uppercase">{accountHolder}</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] text-slate-400 block">Số tiền thanh toán</span>
            <span className="font-mono text-sm font-black text-emerald-700">
              {formatVND(totalAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCopy(String(totalAmount), 'amount')}
            className="inline-flex items-center gap-1 text-[11px] text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-1 rounded font-semibold transition-colors cursor-pointer"
          >
            {copiedField === 'amount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'amount' ? 'Đã chép' : 'Chép'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
          <div>
            <span className="text-[10px] text-emerald-800 block font-semibold">Nội dung chuyển khoản (bắt buộc)</span>
            <span className="font-mono text-xs font-black text-emerald-900 tracking-wider">
              {transferMemo}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCopy(transferMemo, 'memo')}
            className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
          >
            {copiedField === 'memo' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedField === 'memo' ? 'Đã chép' : 'Chép'}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* 3. Placeholder cổng thanh toán thẻ (chưa wire, giữ UX hiện có)      */
/* ------------------------------------------------------------------ */

export const CardPaymentPlaceholder: React.FC = () => (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
    <CreditCard className="w-10 h-10 text-slate-400 mx-auto" />
    <div className="space-y-1">
      <h4 className="text-sm font-bold text-slate-800">Cổng thanh toán thẻ VNPay / OnePay</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto">
        Bạn sẽ được chuyển hướng sang cổng thanh toán liên kết ngân hàng để nhập thông tin thẻ nội địa NAPAS hoặc thẻ quốc tế.
      </p>
    </div>
    <Button variant="outline" size="sm" className="cursor-pointer text-xs font-semibold">
      <span>Chuyển tới cổng thanh toán thẻ</span>
      <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
    </Button>
  </div>
);

/* ------------------------------------------------------------------ */
/* 4. Bảng kê chi tiết (2 biến thể: nợ phạt / đặt cọc)                 */
/* ------------------------------------------------------------------ */

export type PaymentBreakdownVariant = 'OVERDUE_PENALTY' | 'RESERVATION';

export interface PaymentBreakdownTableProps {
  variant: PaymentBreakdownVariant;
  totalAmount: number;
  rentalMonths: number;
  monthlyPrice: number;
  rentalFee: number;
  depositAmount: number;
  /** Nhãn hệ số cọc theo BOM Policy (ISS-67) — tính sẵn trong modal */
  depositMultiplierLabel: string;
}

export const PaymentBreakdownTable: React.FC<PaymentBreakdownTableProps> = ({
  variant,
  totalAmount,
  rentalMonths,
  monthlyPrice,
  rentalFee,
  depositAmount,
  depositMultiplierLabel,
}) =>
  variant === 'OVERDUE_PENALTY' ? (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-2.5 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
        <span>Chi tiết khoản phí cần thanh toán</span>
        <span className="text-[11px] text-rose-600 font-semibold">Tất toán nợ phạt</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>Phí phạt quá hạn tích lũy:</span>
        <span className="font-bold text-rose-600">{formatVND(totalAmount)}</span>
      </div>
      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
        <span className="font-bold text-[#0a1614]">Tổng tiền cần thanh toán:</span>
        <span className="font-extrabold text-base text-rose-600">{formatVND(totalAmount)}</span>
      </div>
    </div>
  ) : (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-2.5 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
        <span>Bảng kê chi tiết nộp cọc</span>
        <span className="text-[11px] text-brand-600 font-normal">Tách bạch theo quy định</span>
      </div>

      <div className="flex justify-between text-slate-600">
        <span>Tiền thuê kho ({rentalMonths} tháng x {formatVND(monthlyPrice)}):</span>
        <span className="font-semibold text-slate-800">{formatVND(rentalFee)}</span>
      </div>

      <div className="flex justify-between text-slate-600">
        <div>
          <span className="block">Tiền cọc bảo đảm ({depositMultiplierLabel} × tháng tiền thuê):</span>
          <span className="text-[10px] text-slate-400 italic">
            Được hoàn lại 100% khi thanh lý hợp đồng đúng hạn
          </span>
        </div>
        <span className="font-semibold text-slate-800">{formatVND(depositAmount)}</span>
      </div>

      <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
        <span className="font-bold text-[#0a1614]">Tổng thanh toán ban đầu:</span>
        <span className="font-extrabold text-base text-brand-600">{formatVND(totalAmount)}</span>
      </div>
    </div>
  );

/* ------------------------------------------------------------------ */
/* 5. Badge trạng thái đối soát tự động (auto-polling)                 */
/* ------------------------------------------------------------------ */

export interface PollingStatusBadgeProps {
  isPaid: boolean;
  isInitializing: boolean;
  paymentType: string;
  orderCode: number | null;
}

export const PollingStatusBadge: React.FC<PollingStatusBadgeProps> = ({
  isPaid,
  isInitializing,
  paymentType,
  orderCode,
}) => (
  <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
    <div className="flex items-center gap-2">
      <RefreshCw className={`w-4 h-4 text-emerald-600 ${isPaid ? '' : 'animate-spin'}`} />
      <span className="font-medium">
        {isPaid
          ? (paymentType === 'OVERDUE_PENALTY' ? 'Thanh toán nợ phạt thành công!' : 'Giao dịch thành công! Đang cấp thẻ nhận kho...')
          : isInitializing
          ? 'Đang khởi tạo mã đơn hàng thanh toán PayOS VietQR...'
          : 'Hệ thống đang tự động quét đối soát chuyển khoản VietQR (mỗi 3 giây)...'}
      </span>
    </div>
    {orderCode && (
      <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold flex-shrink-0">
        Mã: #{orderCode}
      </span>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* 6. Trọn bộ nút hành động (Sandbox / Mở cổng / Đóng / Kiểm tra)     */
/* ------------------------------------------------------------------ */

export interface PaymentActionButtonsProps {
  isPaid: boolean;
  isSimulating: boolean;
  isInitializing: boolean;
  isVerifying: boolean;
  orderCode: number | null;
  checkoutUrl: string | undefined;
  onSandboxTransfer: () => void;
  onClose: () => void;
  onCheckNow: () => void;
}

export const PaymentActionButtons: React.FC<PaymentActionButtonsProps> = ({
  isPaid,
  isSimulating,
  isInitializing,
  isVerifying,
  orderCode,
  checkoutUrl,
  onSandboxTransfer,
  onClose,
  onCheckNow,
}) => (
  <div className="space-y-2.5 pt-2">
    {!isPaid && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onSandboxTransfer}
          disabled={isSimulating || isPaid || isInitializing || !orderCode}
          className="w-full py-2.5 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 border border-emerald-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{isSimulating ? 'Đang chuyển tiền...' : isInitializing ? 'Đang tạo đơn...' : 'Xác nhận Sandbox tại chỗ'}</span>
        </Button>

        <a
          href={checkoutUrl || (orderCode ? `/payment/checkout?orderCode=${orderCode}` : '#')}
          target="_blank"
          rel="noopener noreferrer"
          className={`w-full py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs text-center border whitespace-nowrap ${
            !orderCode || isInitializing
              ? 'pointer-events-none opacity-50 bg-slate-100 text-slate-400 border-slate-200'
              : 'text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 border-blue-200'
          }`}
        >
          <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Mở Cổng VietQR Sandbox</span>
        </a>
      </div>
    )}

    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="md"
        onClick={onClose}
        disabled={isVerifying}
        className="w-1/3 py-2.5 text-xs font-semibold cursor-pointer rounded-xl"
      >
        Đóng
      </Button>

      <Button
        variant="primary"
        size="md"
        onClick={onCheckNow}
        disabled={isVerifying || isPaid || isInitializing || !orderCode}
        className="w-2/3 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer rounded-xl whitespace-nowrap"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang kiểm tra đối soát...</span>
          </>
        ) : isPaid ? (
          <>
            <Check className="w-4 h-4" />
            <span>Đã thanh toán thành công!</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>Kiểm tra trạng thái ngay</span>
          </>
        )}
      </Button>
    </div>
  </div>
);
