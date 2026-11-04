const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function vnpayPayHref(orderCode: number, bankCode: 'VNBANK' | 'INTCARD') {
  return `${apiBase}/payments/vnpay/pay/${orderCode}?bankCode=${bankCode}`;
}

export function VnpayPayLinks({ orderCode }: { orderCode?: number | null }) {
  if (!orderCode) {
    return <p className="text-sm text-slate-600">Đang tạo mã thanh toán...</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={vnpayPayHref(orderCode, 'VNBANK')}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold rounded-xl bg-brand-500 text-white border border-brand-500"
        >
          Thẻ ngân hàng nội địa
        </a>
        <a
          href={vnpayPayHref(orderCode, 'INTCARD')}
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold rounded-xl bg-white text-slate-800 border border-slate-300"
        >
          Thẻ Visa
        </a>
      </div>
      <p className="text-xs text-slate-500">
        Trên sandbox, thẻ nội địa chọn ngân hàng NCB. Thẻ Visa mở form thẻ quốc tế.
      </p>
    </div>
  );
}
