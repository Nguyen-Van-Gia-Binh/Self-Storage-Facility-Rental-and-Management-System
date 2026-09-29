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
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import {
  createCheckout,
  pollPaymentStatus,
  generateMoveInPass,
  type CheckoutResult,
} from '@/api/payment';
import { DigitalMoveInPassModal } from '../components/DigitalMoveInPassModal';
import type { MoveInPassData } from '@/types';
import { tokenStorage } from '@/utils/tokenStorage';

export const PaymentPage: React.FC = () => {
  const policy = useActivePolicy();
  const holdHours = policy?.reservationHoldHours ?? 0;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Auth Guard: Mục 2 — Yêu cầu đăng nhập trước khi thanh toán
  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [navigate]);

  // Đọc thông số từ URL query hoặc người dùng hiện tại
  const unitNumber = searchParams.get('unitNumber') || '';
  const facilityId = searchParams.get('facilityId') || '';
  const facilityName = searchParams.get('facilityName') || 'Cơ sở lưu trữ';
  const facilityAddress = searchParams.get('facilityAddress') || '';
  const facilityPhone = searchParams.get('facilityPhone') || '';
  const rentalMonths = Number(searchParams.get('months')) || 1;
  const monthlyPrice = Number(searchParams.get('monthlyPrice')) || 0;
  const depositFromQuery = searchParams.get('depositAmount');
  const explicitAmount = Number(searchParams.get('amount')) || 0;
  const currentUser = tokenStorage.getUser();
  const customerName = searchParams.get('customerName') || currentUser?.fullName || '';
  const customerPhone = searchParams.get('customerPhone') || (currentUser as { phone?: string } | null)?.phone || '';
  const customerIdCard = searchParams.get('cccd') || '';
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const contractIdParam = searchParams.get('contractId');
  const reservationIdParam = searchParams.get('reservationId');

  // Số tiền đến từ báo giá (depositAmount) hoặc khoản đã chốt (amount). Không tự đặt cọc bằng 1 tháng.
  const rentalFee = monthlyPrice > 0 ? rentalMonths * monthlyPrice : 0;
  const depositAmount = depositFromQuery != null && depositFromQuery !== '' ? Number(depositFromQuery) : 0;
  const quotedTotal = monthlyPrice > 0 ? rentalFee + depositAmount : 0;
  const totalAmount = explicitAmount > 0 ? explicitAmount : quotedTotal;
  const priceReady = totalAmount > 0;

  // State phương thức thanh toán
  const [selectedMethod, setSelectedMethod] = useState<'VIETQR' | 'CARD'>('VIETQR');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  // State modal thẻ nhận kho
  const [showPassModal, setShowPassModal] = useState(false);
  const [createdPass, setCreatedPass] = useState<MoveInPassData | null>(null);

  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (holdHours > 0) {
      setSecondsRemaining(holdHours * 3600);
    }
  }, [holdHours]);

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
    return clean.slice(-4) || '';
  }, [customerIdCard]);

  // Thông tin ngân hàng & QR
  const transferMemo = `SMARTSTORAGE ${unitNumber}${idLast4 ? ` ${idLast4}` : ''}`;
  const bankAccount = checkoutData?.accountNumber || '0888567999';
  const bankName = 'MB Bank (Ngân hàng Quân Đội)';
  const accountHolder = checkoutData?.accountName || 'CONG TY CP SMARTSTORAGE VIETNAM';

  // Khởi tạo link PayOS checkout
  useEffect(() => {
    if (!priceReady) return;
    let isSubscribed = true;
    const refType = contractIdParam ? 'CONTRACT_RENEWAL' : 'RESERVATION';
    const refId = contractIdParam
      ? Number(contractIdParam)
      : reservationIdParam
      ? Number(reservationIdParam)
      : 0;

    createCheckout({
      referenceType: refType,
      referenceId: refId,
      amount: totalAmount,
      description: transferMemo,
    })
      .then((res) => {
        if (isSubscribed) {
          setCheckoutData(res);
          setOrderCode(res.orderCode);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khởi tạo PayOS checkout:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [priceReady, totalAmount, transferMemo, contractIdParam, reservationIdParam]);

  // Auto-polling trạng thái giao dịch mỗi 3s (SC-03)
  useEffect(() => {
    if (!orderCode || isPaid) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await pollPaymentStatus(orderCode);
        if (res.status === 'PAID' || res.status === 'SUCCESS') {
          setIsPaid(true);
          clearInterval(intervalId);

          const pass = generateMoveInPass({
            reservationId: `RES-${orderCode}`,
            unitNumber,
            facilityId: facilityId || '',
            facilityName,
            facilityAddress,
            facilityPhone,
            customerName,
            customerPhone,
            customerIdentity: customerIdCard,
            startDate,
            checkInWindow: holdHours > 0 ? `Giữ chỗ ${holdHours} giờ kể từ lúc đặt cọc` : 'Giữ chỗ theo chính sách đang hiệu lực',
            totalPaid: totalAmount,
          });

          setCreatedPass(pass);
          setShowPassModal(true);
        }
      } catch (err) {
        console.error('Lỗi auto-polling payment status trên PaymentPage:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [
    orderCode,
    isPaid,
    unitNumber,
    facilityName,
    facilityAddress,
    facilityPhone,
    customerName,
    customerPhone,
    customerIdCard,
    startDate,
    totalAmount,
  ]);

  const vietQrUrl =
    checkoutData?.qrCode ||
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=vietqr://${totalAmount}/${transferMemo}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCheckNow = async () => {
    if (!orderCode) return;
    setIsVerifying(true);
    setPaymentNotice(null);
    try {
      const res = await pollPaymentStatus(orderCode);
      if (res.status === 'PAID' || res.status === 'SUCCESS') {
        setIsPaid(true);
        const pass = generateMoveInPass({
          reservationId: `RES-${orderCode}`,
          unitNumber,
          facilityId: 'FAC-D7-01',
          facilityName,
          facilityAddress,
          facilityPhone,
          customerName,
          customerPhone,
          customerIdentity: customerIdCard,
          startDate,
          checkInWindow: holdHours > 0 ? `Giữ chỗ ${holdHours} giờ kể từ lúc đặt cọc` : 'Giữ chỗ theo chính sách đang hiệu lực',
          totalPaid: totalAmount,
        });

        setCreatedPass(pass);
        setIsVerifying(false);
        setShowPassModal(true);
      } else {
        // Chưa thanh toán thành công (BR-ACC-01): Tuyệt đối không sinh pass hoặc mở modal
        setIsVerifying(false);
        setPaymentNotice('Hệ thống chưa ghi nhận thanh toán. Vui lòng hoàn tất chuyển khoản trước khi kiểm tra!');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra đối soát thanh toán:', err);
      setIsVerifying(false);
      setPaymentNotice('Lỗi kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.');
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
            Thanh Toán Đặt Chỗ Ô Kho {unitNumber}
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
                  Thời hạn bảo lưu giữ chỗ {holdHours > 0 ? `${holdHours} giờ` : 'theo chính sách'}
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

                {/* Confirm Action Bar with Auto-polling status (SC-03) */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-900">
                    <RefreshCw className={`w-4 h-4 text-emerald-600 flex-shrink-0 ${isPaid ? '' : 'animate-spin'}`} />
                    <span>
                      {isPaid
                        ? 'Thanh toán thành công! Đang kích hoạt thẻ nhận kho...'
                        : 'Hệ thống tự động quét nhận diện giao dịch VietQR Napas247 (mỗi 3 giây).'}
                    </span>
                    {orderCode && (
                      <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold ml-1">
                        #{orderCode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {checkoutData?.checkoutUrl && !isPaid && (
                      <a
                        href={checkoutData.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2.5 rounded-lg transition-colors"
                      >
                        <span>Mở cổng thanh toán VietQR Sandbox</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleCheckNow}
                      disabled={isVerifying || isPaid}
                      className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      {isVerifying ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Đang kiểm tra đối soát...</span>
                        </>
                      ) : isPaid ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Đã thanh toán thành công</span>
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

                {/* Thông báo đối soát / chưa thanh toán */}
                {paymentNotice && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{paymentNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentNotice(null)}
                      className="text-amber-700 hover:text-amber-900 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}
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
                <span className="text-slate-500">Mã ô kho:</span>
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
              {!priceReady ? (
                <p className="text-sm font-semibold text-slate-600">Chưa có số tiền cần thanh toán.</p>
              ) : (
                <>
                  {monthlyPrice > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tiền thuê {rentalMonths} tháng:</span>
                      <span className="font-semibold text-slate-800">{formatVND(rentalFee)}</span>
                    </div>
                  )}
                  {depositFromQuery != null && depositFromQuery !== '' && (
                    <div className="flex justify-between text-slate-600">
                      <div>
                        <span className="block">Tiền cọc bảo đảm:</span>
                        <span className="text-[10px] text-slate-400 italic">
                          Quyết toán hoàn lại khi hết hạn
                        </span>
                      </div>
                      <span className="font-semibold text-slate-800">{formatVND(depositAmount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">Tổng cộng thanh toán:</span>
                    <span className="font-black text-lg text-brand-600">{formatVND(totalAmount)}</span>
                  </div>
                </>
              )}
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
