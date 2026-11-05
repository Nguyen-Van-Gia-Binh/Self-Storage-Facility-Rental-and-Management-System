import { useState } from 'react';
import { CreditCard, Landmark, ExternalLink, Info } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function vnpayPayHref(orderCode: number, bankCode: 'VNBANK' | 'INTCARD') {
  return `${apiBase}/payments/vnpay/pay/${orderCode}?bankCode=${bankCode}`;
}

export interface VnpayPayLinksProps {
  orderCode?: number | null;
  className?: string;
}

export function VnpayPayLinks({ orderCode, className = '' }: VnpayPayLinksProps) {
  const [redirectingBank, setRedirectingBank] = useState<'VNBANK' | 'INTCARD' | null>(null);

  if (!orderCode) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
        <p className="text-sm text-slate-500 font-medium">Đang khởi tạo cổng VNPay...</p>
      </div>
    );
  }

  const handleRedirect = (bankCode: 'VNBANK' | 'INTCARD') => {
    setRedirectingBank(bankCode);
    window.location.href = vnpayPayHref(orderCode, bankCode);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <CreditCard className="w-4 h-4 text-emerald-600" />
        <span>Chọn phương thức thanh toán VNPay Sandbox</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Nút 1: Thẻ ATM / Tài khoản nội địa */}
        <button
          type="button"
          onClick={() => handleRedirect('VNBANK')}
          disabled={redirectingBank !== null}
          className="group relative p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-600 transition-all text-left flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
              Khuyên dùng
            </span>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
              <span>Thẻ ATM / Tài khoản nội địa</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Hỗ trợ ngân hàng <strong>NCB</strong> và các ngân hàng nội địa trong liên minh Napas.
            </p>
          </div>

          {redirectingBank === 'VNBANK' && (
            <div className="mt-2 text-xs font-semibold text-emerald-700 animate-pulse">
              Đang chuyển hướng sang VNPay...
            </div>
          )}
        </button>

        {/* Nút 2: Thẻ Quốc tế */}
        <button
          type="button"
          onClick={() => handleRedirect('INTCARD')}
          disabled={redirectingBank !== null}
          className="group relative p-4 rounded-2xl border border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/80 transition-all text-left flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Quốc tế
            </span>
          </div>

          <div className="mt-3">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors flex items-center gap-1.5">
              <span>Thẻ Quốc tế (Visa / Master)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            </h4>
            <p className="text-xs text-slate-600 mt-1">
              Thanh toán an toàn qua cổng quốc tế với thẻ Visa, MasterCard, JCB.
            </p>
          </div>

          {redirectingBank === 'INTCARD' && (
            <div className="mt-2 text-xs font-semibold text-slate-700 animate-pulse">
              Đang chuyển hướng sang VNPay...
            </div>
          )}
        </button>
      </div>

      {/* Thông tin hỗ trợ test VNPay Sandbox */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Thông tin thẻ test VNPay Sandbox (Ngân hàng NCB):</div>
          <div className="font-mono text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-amber-950">
            <div>Số thẻ: <strong>9704198526191432198</strong></div>
            <div>Tên: <strong>NGUYEN VAN A</strong></div>
            <div>Ngày phát hành: <strong>07/15</strong></div>
            <div>Mã OTP: <strong>123456</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
