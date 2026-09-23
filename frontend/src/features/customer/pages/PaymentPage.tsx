import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  QrCode,
  CreditCard,
  Clock,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { verifyPayment, generateMoveInPass } from '@/api/payment';
import { DigitalMoveInPassModal } from '../components/DigitalMoveInPassModal';
import type { MoveInPassData } from '@/types';

export const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Đọc thông số từ URL query hoặc mặc định
  const unitNumber = searchParams.get('unitNumber') || 'A102';
  const facilityName = searchParams.get('facilityName') || 'SmartStorage Quận 7 Flagship';
  const facilityAddress =
    searchParams.get('facilityAddress') || '52 Nguyễn Hữu Thọ, Phường Tân Phong, Quận 7, TP.HCM';
  const facilityPhone = searchParams.get('facilityPhone') || '1900 8888';
  const rentalMonths = Number(searchParams.get('months')) || 3;
  const monthlyPrice = Number(searchParams.get('monthlyPrice')) || 2400000;
  const customerName = searchParams.get('customerName') || 'Nguyễn Phạm Xuân Nhi';
  const customerPhone = searchParams.get('customerPhone') || '0908 123 456';
  const customerIdCard = searchParams.get('cccd') || '079199001234';
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];

  // Tính toán phí
  const rentalFee = rentalMonths * monthlyPrice;
  const depositAmount = monthlyPrice; // Cọc 1 tháng (BR-DEP-01)
  const totalAmount = rentalFee + depositAmount;

  // State phương thức thanh toán
  const [selectedMethod, setSelectedMethod] = useState<'VIETQR' | 'CARD'>('VIETQR');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // State modal thẻ nhận kho
  const [showPassModal, setShowPassModal] = useState(false);
  const [createdPass, setCreatedPass] = useState<MoveInPassData | null>(null);

  // 48 giờ đếm ngược (BR-DEP-03)
  const [secondsRemaining, setSecondsRemaining] = useState(172800);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 4 số cuối CCCD
  const idLast4 = useMemo(() => {
    const clean = customerIdCard.replace(/\D/g, '');
    return clean.slice(-4) || '1234';
  }, [customerIdCard]);

  // Thông tin ngân hàng & QR
  const transferMemo = `SMARTSTORAGE ${unitNumber} ${idLast4}`;
  const bankAccount = '0888567999';
  const bankName = 'MB Bank (Ngân hàng Quân Đội)';
  const accountHolder = 'CONG TY CP SMARTSTORAGE VIETNAM';

  const vietQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=vietqr://${totalAmount}/${transferMemo}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPaid = async () => {
    setIsVerifying(true);
    try {
      await verifyPayment(`PAY-${unitNumber}-${Date.now()}`);

      const pass = generateMoveInPass({
        reservationId: `RES-${Date.now()}`,
        unitNumber,
        facilityId: 'FAC-D7-01',
        facilityName,
        facilityAddress,
        facilityPhone,
        customerName,
        customerPhone,
        customerIdentity: customerIdCard,
        startDate,
        checkInWindow: 'Trong vòng 48 giờ kể từ lúc cọc',
        totalPaid: totalAmount,
      });

      setCreatedPass(pass);
      setIsVerifying(false);
      setShowPassModal(true);
    } catch (err) {
      console.error('Lỗi đối soát thanh toán:', err);
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/customer" className="hover:text-brand-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <Link to="/customer/units" className="hover:text-brand-600 transition-colors">
          Chọn ô kho
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="font-semibold text-slate-800">Thanh toán trực tuyến (VietQR)</span>
      </nav>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Cổng Thanh Toán Napas247
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a1614] tracking-tight">
            Thanh Toán Đặt Chỗ Ngăn Tủ {unitNumber}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quét mã VietQR chuyển khoản liên ngân hàng 24/7. Hệ thống tự động xác nhận và cấp Thẻ nhận kho trong vài giây.
          </p>
        </div>

        <Link to="/customer/units">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại chọn ô</span>
          </Button>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: VietQR Payment Box (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {/* 48-Hour Atomic Hold Countdown (BR-DEP-03) */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 flex-shrink-0">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  Thời hạn bảo lưu giữ chỗ 48 giờ
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-800">
                  Ô kho {unitNumber} đang được bảo lưu nguyên tử cho bạn. Vui lòng hoàn tất nộp cọc trước khi hết hạn.
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-mono text-lg sm:text-xl font-black text-amber-900 tracking-wider">
                {formatCountdown(secondsRemaining)}
              </span>
              <span className="text-[10px] text-amber-700 block uppercase font-bold">Thời gian còn lại</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                Phương thức chuyển khoản
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('VIETQR')}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all text-left cursor-pointer ${
                    selectedMethod === 'VIETQR'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      VietQR Napas247
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                        Khuyên dùng
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Xác nhận tức thì qua app ngân hàng</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 transition-all text-left cursor-pointer ${
                    selectedMethod === 'CARD'
                      ? 'border-brand-600 bg-brand-50/50 text-brand-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black">Thẻ ATM / Thẻ Quốc Tế</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Visa, Mastercard, JCB, Napas</div>
                  </div>
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            {selectedMethod === 'VIETQR' ? (
              <div className="space-y-4 pt-2">
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
                  {/* Left: Dynamic QR Image */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm relative group">
                      <img
                        src={vietQrUrl}
                        alt="VietQR Napas247"
                        className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold bg-white text-slate-800 px-3 py-1 rounded shadow-md">
                          Quét mã Napas247
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-medium mt-2 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-brand-600" />
                      Mở app ngân hàng để quét mã
                    </span>
                  </div>

                  {/* Right: Bank Account Details with Copy Buttons */}
                  <div className="w-full space-y-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase font-semibold">
                        Ngân hàng thụ hưởng
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-sm">
                        <Building2 className="w-4 h-4 text-brand-600" />
                        {bankName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Số tài khoản</span>
                        <span className="font-mono text-base font-black text-slate-900 tracking-wider">
                          0888 567 999
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(bankAccount, 'account')}
                        className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        {copiedField === 'account' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedField === 'account' ? 'Đã chép' : 'Chép số TK'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Chủ tài khoản</span>
                        <span className="text-xs font-extrabold text-slate-800 uppercase">{accountHolder}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Số tiền thanh toán</span>
                        <span className="font-mono text-base font-black text-emerald-700">
                          {formatVND(totalAmount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(totalAmount), 'amount')}
                        className="inline-flex items-center gap-1 text-xs text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        {copiedField === 'amount' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedField === 'amount' ? 'Đã chép' : 'Chép số tiền'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                      <div>
                        <span className="text-[10px] text-emerald-800 block font-bold uppercase tracking-wider">
                          Nội dung chuyển khoản (bắt buộc)
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-900 tracking-wider">
                          {transferMemo}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(transferMemo, 'memo')}
                        className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2.5 py-1.5 rounded-lg font-black transition-colors cursor-pointer"
                      >
                        {copiedField === 'memo' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedField === 'memo' ? 'Đã chép' : 'Chép nội dung'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm Action Bar */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Sau khi chuyển khoản, bấm nút bên dưới để hệ thống đối soát và sinh vé Move-in Pass.</span>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleConfirmPaid}
                    disabled={isVerifying}
                    className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang đối soát giao dịch...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Tôi đã chuyển khoản thành công</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">Cổng thanh toán thẻ VNPay / OnePay</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Hỗ trợ tất cả các loại thẻ ghi nợ nội địa NAPAS và thẻ quốc tế Visa, Mastercard, JCB.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="cursor-pointer text-xs font-semibold">
                  <span>Chuyển tới cổng thanh toán thẻ</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Booking Summary & Financial Breakdown (4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-5">
          {/* Booking Summary Card */}
          <Card className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Tóm tắt đơn đặt chỗ
            </h3>

            {/* Unit Info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã ngăn kho:</span>
                <span className="font-extrabold text-brand-700 text-sm">{unitNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian thuê:</span>
                <span className="font-bold text-slate-800">{rentalMonths} tháng</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngày bắt đầu:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {startDate}
                </span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{customerName}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                SĐT: {customerPhone} • CCCD: {customerIdCard}
              </div>
            </div>

            {/* Facility Details */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>{facilityName}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pl-5">{facilityAddress}</p>
            </div>

            {/* Financial Breakdown Table: BR-DEP-02 & BR-PAY-01 */}
            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền thuê {rentalMonths} tháng:</span>
                <span className="font-semibold text-slate-800">{formatVND(rentalFee)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <div>
                  <span className="block">Tiền cọc bảo đảm (1 tháng):</span>
                  <span className="text-[10px] text-slate-400 italic">
                    Quyết toán hoàn lại khi hết hạn
                  </span>
                </div>
                <span className="font-semibold text-slate-800">{formatVND(depositAmount)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Tổng cộng thanh toán:</span>
                <span className="font-black text-lg text-brand-600">{formatVND(totalAmount)}</span>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Thanh toán an toàn qua cổng VietQR Napas247. Hỗ trợ hủy đơn hoàn cọc 100% trước 24 giờ nhận kho.
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Digital Move-in Pass Modal */}
      <DigitalMoveInPassModal
        isOpen={showPassModal}
        onClose={() => {
          setShowPassModal(false);
          navigate('/customer/my-units');
        }}
        passData={createdPass}
      />
    </div>
  );
};
