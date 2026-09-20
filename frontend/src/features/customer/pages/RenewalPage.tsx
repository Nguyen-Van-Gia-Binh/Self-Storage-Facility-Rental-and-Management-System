import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  QrCode, 
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { mockRentedContracts } from '../mockData';
import { formatVND } from '../utils/pricing';

export const RenewalPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const contract = useMemo(() => {
    return mockRentedContracts.find(c => c.id === contractId) || mockRentedContracts[0];
  }, [contractId]);

  const [renewalMonths, setRenewalMonths] = useState<number>(3);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [copiedBankInfo, setCopiedBankInfo] = useState<boolean>(false);

  // Calculate new extended end date
  const newEndDate = useMemo(() => {
    const currentEnd = new Date(contract.endDate);
    currentEnd.setMonth(currentEnd.getMonth() + renewalMonths);
    return currentEnd.toISOString().split('T')[0];
  }, [contract.endDate, renewalMonths]);

  // Pricing calculation for renewal (no extra deposit needed!)
  const pricing = useMemo(() => {
    const rawTotal = contract.monthlyRent * renewalMonths;
    let discountRate = 0;
    if (renewalMonths >= 12) discountRate = 0.10;
    else if (renewalMonths >= 6) discountRate = 0.05;

    const discountAmount = Math.round((rawTotal * discountRate) / 1000) * 1000;
    const finalTotal = rawTotal - discountAmount;

    return {
      rawTotal,
      discountRate,
      discountAmount,
      finalTotal,
    };
  }, [contract.monthlyRent, renewalMonths]);

  const transferContent = `GIAHAN ${contract.unitNumber} ${contract.contractNumber.slice(-7)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Breadcrumbs */}
      <div className="border-b border-slate-200/80 pb-4">
        <Link
          to="/customer/my-units"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Quay lại danh sách kho của tôi
        </Link>
        <div className="flex items-center gap-1.5 text-brand-600 font-semibold text-xs tracking-wider uppercase mb-1">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Gia Hạn Hợp Đồng Trực Tuyến (SmartStorage)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a1614] tracking-tight">
          Gia Hạn Ngăn Kho {contract.unitNumber}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Gia hạn thêm thời gian sử dụng mà không cần làm lại thủ tục cọc. Mã PIN khóa điện tử được giữ nguyên liên tục.
        </p>
      </div>

      {!isSubmitted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Extension Form (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Current Contract Info Card */}
            <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-[#7c94c3] bg-[#7c94c3]/12 px-2.5 py-0.5 rounded-full">
                      Hợp đồng #{contract.contractNumber}
                    </span>
                    <Badge variant="available" className="text-[10px] px-1.5 py-0.5">Đang có hiệu lực</Badge>
                  </div>
                  <h2 className="text-base font-bold text-[#0a1614]">
                    {contract.unitTypeName} · Cơ sở {contract.facilityName}
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Tiền thuê tháng hiện tại</span>
                  <span className="text-sm sm:text-base font-bold text-brand-600">{formatVND(contract.monthlyRent)}/tháng</span>
                </div>
              </div>

              {/* Timeline extension comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">Ngày hết hạn hiện tại:</span>
                  <span className="text-sm font-bold text-slate-800 block">{contract.endDate}</span>
                  <span className="text-[11px] text-amber-700">Cần gia hạn trước khi hết hạn</span>
                </div>

                <div className="p-3 bg-[#f2f9f7] rounded-lg border border-emerald-200 space-y-1">
                  <span className="text-brand-700 font-semibold block">Ngày hết hạn mới sau gia hạn:</span>
                  <span className="text-sm font-bold text-brand-800 block">{newEndDate}</span>
                  <span className="text-[11px] text-emerald-600">+{renewalMonths} tháng sử dụng liên tục</span>
                </div>
              </div>

              {/* Renewal Duration Selector */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-sm font-semibold text-[#0a1614]">
                  Chọn kỳ hạn gia hạn thêm:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { months: 1, label: '1 Tháng', discountTag: null },
                    { months: 3, label: '3 Tháng', discountTag: 'Phổ biến' },
                    { months: 6, label: '6 Tháng', discountTag: 'Giảm 5%' },
                    { months: 12, label: '12 Tháng', discountTag: 'Giảm 10%' },
                  ].map((pkg) => {
                    const isSelected = renewalMonths === pkg.months;
                    return (
                      <button
                        key={pkg.months}
                        type="button"
                        onClick={() => setRenewalMonths(pkg.months)}
                        className={`p-3.5 rounded-xl border text-center relative transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {pkg.discountTag && (
                          <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            pkg.months >= 6 
                              ? 'bg-[#7c94c3] text-white' 
                              : 'bg-brand-500 text-white'
                          }`}>
                            {pkg.discountTag}
                          </span>
                        )}
                        <span className={`block font-bold text-sm ${isSelected ? 'text-brand-700' : 'text-[#0a1614]'}`}>
                          {pkg.label}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          +{pkg.months} tháng
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* No Extra Deposit Notification */}
              <div className="p-3.5 rounded-lg bg-[#96b3cf]/12 border border-[#96b3cf]/30 flex items-start gap-2.5 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#0a1614]">Miễn thu thêm tiền cọc (BR-DEP-01):</strong> Khoản tiền cọc ban đầu <strong>{formatVND(contract.depositHeld)}</strong> tiếp tục được bảo lưu. Quý khách chỉ cần thanh toán đúng tiền thuê kỳ gia hạn mới.
                </p>
              </div>
            </Card>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/customer/my-units')}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsSubmitted(true)}
                className="px-6 py-2.5 flex items-center gap-2"
              >
                <span>Xác nhận & Nhận mã thanh toán VietQR</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pricing Summary (1/3) */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border border-slate-200/90 rounded-xl space-y-5 sticky top-24">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#0a1614]">
                  Tổng Chi Phí Gia Hạn
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thanh toán gia hạn kỳ mới cho ngăn {contract.unitNumber}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Giá thuê:</span>
                  <span className="font-medium text-slate-800">{formatVND(contract.monthlyRent)}/tháng</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Thời gian gia hạn:</span>
                  <span className="font-medium text-slate-800">{renewalMonths} tháng</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tiền thuê kỳ gia hạn:</span>
                  <span className="font-medium text-slate-800">{formatVND(pricing.rawTotal)}</span>
                </div>

                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-[#7c94c3] bg-[#7c94c3]/10 px-2.5 py-1.5 rounded-md text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Giảm giá dài hạn:
                    </span>
                    <span>-{formatVND(pricing.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <span>Tiền cọc phát sinh:</span>
                  <span className="font-semibold text-emerald-600">0 ₫ (Đã cọc)</span>
                </div>

                <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-bold text-[#0a1614] block">Tổng thanh toán:</span>
                    <span className="text-[11px] text-slate-500">Kỳ mới đến {newEndDate}</span>
                  </div>
                  <span className="text-xl font-extrabold text-brand-600">
                    {formatVND(pricing.finalTotal)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* CONFIRMATION & VIETQR PAYMENT */
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 bg-white border border-slate-200/90 rounded-xl space-y-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Yêu cầu gia hạn hợp đồng đã sẵn sàng
              </div>
              <h2 className="text-2xl font-bold text-[#0a1614]">
                Quét Mã VietQR Hoàn Tất Gia Hạn
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Sau khi ngân hàng báo chuyển khoản thành công, thời hạn thuê của ngăn {contract.unitNumber} sẽ được tự động cộng thêm {renewalMonths} tháng (đến ngày {newEndDate}).
              </p>
            </div>

            {/* QR display */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200/80 max-w-sm mx-auto">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=vietqr://${pricing.finalTotal}/${transferContent}`}
                  alt="VietQR Code"
                  className="w-44 h-44 object-contain"
                />
                <span className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-brand-600" />
                  VietQR · Napas247
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-2">
                Số tiền thanh toán: <strong className="text-brand-600 text-sm">{formatVND(pricing.finalTotal)}</strong>
              </span>
            </div>

            {/* Banking info */}
            <div className="space-y-2 text-xs text-left max-w-md mx-auto">
              <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                <div>
                  <span className="text-slate-500 block">Số tài khoản MB Bank:</span>
                  <strong className="text-sm text-[#0a1614] font-bold">0888 567 999</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('0888567999')}
                  className="p-1.5 text-slate-400 hover:text-brand-600 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="text-amber-800 font-semibold block">Cú pháp chuyển khoản:</span>
                  <strong className="text-sm text-amber-950 font-bold">{transferContent}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(transferContent)}
                  className="p-1.5 text-amber-700 hover:text-amber-900 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {copiedBankInfo && (
                <div className="text-center text-emerald-600 font-semibold text-xs py-1">
                  ✓ Đã sao chép vào bộ nhớ tạm!
                </div>
              )}
            </div>

            {/* Action return */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
              >
                Quay lại
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/customer/my-units')}
                className="px-6"
              >
                <span>Xong, trở về Quản lý kho</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
