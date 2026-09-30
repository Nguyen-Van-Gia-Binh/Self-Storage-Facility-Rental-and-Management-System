import React, { useState, useEffect, useMemo } from 'react';
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
  X,
  Sparkles,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import {
  createCheckout,
  pollPaymentStatus,
  generateMoveInPass,
  processSandboxTransfer,
  type CheckoutResult,
} from '@/api/payment';
import type { MoveInPassData } from '@/types';
import { tokenStorage } from '@/utils/tokenStorage';

export interface VietQRPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (passData?: MoveInPassData) => void;
  unitNumber: string;
  facilityId?: string | number;
  facilityName: string;
  facilityAddress?: string;
  facilityPhone?: string;
  rentalMonths?: number;
  monthlyPrice?: number;
  rentalFee?: number;
  depositAmount?: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  customerIdCard?: string;
  startDate?: string;
  reservationId?: number;
  contractId?: number;
  paymentType?: 'RESERVATION' | 'CONTRACT_RENEWAL' | 'OVERDUE_PENALTY' | 'SETTLEMENT';
}

export const VietQRPaymentModal: React.FC<VietQRPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  unitNumber,
  facilityId,
  facilityName,
  facilityAddress,
  facilityPhone,
  rentalMonths = 1,
  monthlyPrice = 0,
  rentalFee = 0,
  depositAmount = 0,
  totalAmount,
  customerName,
  customerPhone,
  customerIdCard,
  startDate,
  reservationId,
  contractId,
  paymentType = 'RESERVATION',
}) => {
  const policy = useActivePolicy();
  const holdHours = policy?.reservationHoldHours ?? 0;
  const depositMultiplier = policy?.depositMultiplier ?? 1;
  const depositMultiplierLabel = Number.isInteger(depositMultiplier)
    ? String(depositMultiplier)
    : depositMultiplier.toFixed(1).replace(/\.0$/, '');
  const [selectedMethod, setSelectedMethod] = useState<'VIETQR' | 'CARD'>('VIETQR');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (holdHours > 0) setSecondsRemaining(holdHours * 3600);
  }, [holdHours]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatCountdown = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 4 số cuối CCCD để làm cú pháp memo đối chiếu
  const idLast4 = useMemo(() => {
    const clean = customerIdCard ? customerIdCard.replace(/\D/g, '') : '';
    return clean.slice(-4) || '';
  }, [customerIdCard]);

  // Cú pháp nội dung chuyển khoản bắt buộc
  const transferMemo = paymentType === 'OVERDUE_PENALTY'
    ? `PHAT${contractId || ''} ${unitNumber}`
    : `SMARTSTORAGE ${unitNumber}${idLast4 ? ` ${idLast4}` : ''}`;
  const bankAccount = checkoutData?.accountNumber || '0888567999';
  const bankName = 'MB Bank (Ngân hàng Quân Đội)';
  const accountHolder = checkoutData?.accountName || 'CONG TY CP SMARTSTORAGE VIETNAM';

  // Khởi tạo PayOS checkout link khi modal mở
  useEffect(() => {
    if (!isOpen) {
      setOrderCode(null);
      setCheckoutData(null);
      setIsPaid(false);
      setIsInitializing(false);
      return;
    }

    let isSubscribed = true;
    if (paymentType === 'OVERDUE_PENALTY' && totalAmount <= 0) {
      setIsInitializing(false);
      setPaymentNotice('Hợp đồng này hiện không có nợ phạt quá hạn cần thanh toán.');
      return;
    }

    setIsInitializing(true);
    const refType = paymentType || (contractId ? 'CONTRACT_RENEWAL' : 'RESERVATION');
    const refId = contractId || reservationId || 0;

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
          setIsInitializing(false);
        }
      })
      .catch((err: any) => {
        console.warn('Lỗi khởi tạo checkout PayOS:', err);
        if (isSubscribed) {
          setIsInitializing(false);
          const serverMsg = err?.response?.data?.message || err?.message;
          setPaymentNotice(serverMsg || 'Không thể tạo mã đơn hàng PayOS. Vui lòng đóng và thử lại sau giây lát!');
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, totalAmount, transferMemo, paymentType, contractId, reservationId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 180);
  };

  // Cơ chế Auto-Polling kiểm tra trạng thái mỗi 3 giây (WS3 - SC-03)
  useEffect(() => {
    if (!orderCode || isPaid || !isOpen) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await pollPaymentStatus(orderCode);
        if (res.status === 'PAID' || res.status === 'SUCCESS') {
          setIsPaid(true);
          clearInterval(intervalId);

          if (paymentType === 'OVERDUE_PENALTY') {
            setTimeout(() => {
              handleClose();
              onPaymentSuccess();
            }, 1000);
          } else {
            const pass = generateMoveInPass({
              reservationId: `RES-${orderCode}`,
              unitNumber,
              facilityId: String(facilityId || ''),
              facilityName,
              facilityAddress: facilityAddress || '',
              facilityPhone: facilityPhone || '',
              customerName: customerName || tokenStorage.getUser()?.fullName || '',
              customerPhone: customerPhone || (tokenStorage.getUser() as any)?.phone || '',
              customerIdentity: customerIdCard || '',
              startDate: startDate || new Date().toISOString().split('T')[0],
              checkInWindow: holdHours > 0 ? `Giữ chỗ ${holdHours} giờ kể từ lúc đặt cọc` : 'Giữ chỗ theo chính sách đang hiệu lực',
              totalPaid: totalAmount,
            });

            setTimeout(() => {
              handleClose();
              onPaymentSuccess(pass);
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Lỗi auto-polling payment status:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [
    orderCode,
    isPaid,
    isOpen,
    unitNumber,
    facilityName,
    facilityAddress,
    facilityPhone,
    customerName,
    customerPhone,
    customerIdCard,
    startDate,
    totalAmount,
    onPaymentSuccess,
    paymentType,
  ]);

  // URL sinh VietQR Napas247 chuẩn
  const vietQrUrl =
    checkoutData?.qrCode ||
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=vietqr://${totalAmount}/${transferMemo}`;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Nút chuyển tiền mô phỏng Sandbox nội bộ
  const handleSandboxTransfer = async () => {
    if (!orderCode) {
      setPaymentNotice('Đang khởi tạo mã đơn hàng, vui lòng chờ trong giây lát...');
      return;
    }
    if (isPaid || isSimulating) return;
    setIsSimulating(true);
    setPaymentNotice(null);
    try {
      await processSandboxTransfer(orderCode, 'TRANSFER_SUCCESS');
      setIsPaid(true);
      setTimeout(() => {
        handleClose();
        if (paymentType === 'OVERDUE_PENALTY') {
          onPaymentSuccess();
        } else {
          const pass = generateMoveInPass({
            reservationId: `RES-${orderCode}`,
            unitNumber,
            facilityId: String(facilityId || ''),
            facilityName,
            facilityAddress: facilityAddress || '',
            facilityPhone: facilityPhone || '',
            customerName: customerName || tokenStorage.getUser()?.fullName || '',
            customerPhone: customerPhone || (tokenStorage.getUser() as any)?.phone || '',
            customerIdentity: customerIdCard || '',
            startDate: startDate || new Date().toISOString().split('T')[0],
            checkInWindow: holdHours > 0 ? `Giữ chỗ ${holdHours} giờ kể từ lúc đặt cọc` : 'Giữ chỗ theo chính sách đang hiệu lực',
            totalPaid: totalAmount,
          });
          onPaymentSuccess(pass);
        }
      }, 1000);
    } catch (err: unknown) {
      console.error('Lỗi chuyển tiền Sandbox:', err);
      setPaymentNotice('Không thể xác nhận chuyển tiền Sandbox. Vui lòng thử lại!');
    } finally {
      setIsSimulating(false);
    }
  };

  // Nút kiểm tra thủ công ngay lập tức
  const handleCheckNow = async () => {
    if (!orderCode) return;
    setIsVerifying(true);
    setPaymentNotice(null);
    try {
      const res = await pollPaymentStatus(orderCode);
      if (res.status === 'PAID' || res.status === 'SUCCESS') {
        setIsPaid(true);
        if (paymentType === 'OVERDUE_PENALTY') {
          setIsVerifying(false);
          handleClose();
          onPaymentSuccess();
        } else {
          const pass = generateMoveInPass({
            reservationId: `RES-${orderCode}`,
            unitNumber,
            facilityId: String(facilityId || ''),
            facilityName,
            facilityAddress: facilityAddress || '',
            facilityPhone: facilityPhone || '',
            customerName: customerName || tokenStorage.getUser()?.fullName || '',
            customerPhone: customerPhone || (tokenStorage.getUser() as any)?.phone || '',
            customerIdentity: customerIdCard || '',
            startDate: startDate || new Date().toISOString().split('T')[0],
            checkInWindow: holdHours > 0 ? `Giữ chỗ ${holdHours} giờ kể từ lúc đặt cọc` : 'Giữ chỗ theo chính sách đang hiệu lực',
            totalPaid: totalAmount,
          });

          setIsVerifying(false);
          handleClose();
          onPaymentSuccess(pass);
        }
      } else {
        setIsVerifying(false);
        setPaymentNotice('Hệ thống chưa ghi nhận thanh toán. Vui lòng hoàn tất chuyển khoản trước khi tiếp tục!');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra đối soát thanh toán:', err);
      setIsVerifying(false);
      setPaymentNotice('Lỗi kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
        isClosing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-auto ${
          isClosing ? 'modal-panel-exit' : 'modal-panel-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0d6050] to-[#14937a] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider text-emerald-100">
              <Sparkles className="w-3 h-3 text-amber-300" />
              {paymentType === 'OVERDUE_PENALTY' ? 'Tất Toán Nợ Phạt Quá Hạn (D+n)' : 'Cổng Thanh Toán Trực Tuyến 24/7'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            {paymentType === 'OVERDUE_PENALTY'
              ? `Đóng Nợ Phạt Ô Kho ${unitNumber}`
              : `Thanh Toán Giữ Chỗ Ô Kho ${unitNumber}`}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            {facilityName} {contractId ? `· Hợp đồng #${contractId}` : ''}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {paymentType === 'OVERDUE_PENALTY' ? (
            <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-3.5 flex items-center justify-between gap-3 text-rose-900">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Xử lý quá hạn theo quy định BR-OVD-03</span>
                  <span className="text-[11px] text-rose-700">Phí phạt 10% tiền cọc/ngày. Tất toán nợ để khôi phục quyền Báo trả kho.</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-extrabold text-rose-700 tracking-wider">
                  {formatVND(totalAmount)}
                </span>
                <span className="text-[10px] text-rose-600 block">Nợ phạt phát sinh</span>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse" />
                <div>
                  <span className="text-xs font-bold block">Thời gian giữ chỗ nguyên tử</span>
                  <span className="text-[11px] text-amber-700">Ô kho được khoá ưu tiên cho bạn trong {holdHours > 0 ? `${holdHours} giờ` : 'thời hạn chính sách'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-extrabold text-amber-800 tracking-wider">
                  {formatCountdown(secondsRemaining)}
                </span>
                <span className="text-[10px] text-amber-600 block">Đang đếm ngược</span>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
              Chọn phương thức thanh toán
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedMethod('VIETQR')}
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  selectedMethod === 'VIETQR'
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
                onClick={() => setSelectedMethod('CARD')}
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                  selectedMethod === 'CARD'
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

          {/* VietQR View */}
          {selectedMethod === 'VIETQR' ? (
            <div className="space-y-4">
              {/* QR Image + Bank Transfer Info Box */}
              <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code Container */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="p-2 bg-white rounded-xl border border-slate-200 shadow-xs relative group">
                    <img
                      src={vietQrUrl}
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
                    Quét bằng app ngân hàng
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
                        0888 567 999
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankAccount, 'account')}
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
                      onClick={() => handleCopy(String(totalAmount), 'amount')}
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
                      onClick={() => handleCopy(transferMemo, 'memo')}
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                    >
                      {copiedField === 'memo' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'memo' ? 'Đã chép' : 'Chép'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
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
          )}

          {/* Financial Breakdown Table */}
          {paymentType === 'OVERDUE_PENALTY' ? (
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
                <span>Chi tiết khoản phí cần thanh toán</span>
                <span className="text-[11px] text-rose-600 font-semibold">Tất toán nợ phạt</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí phạt quá hạn tích lũy (BR-OVD-03):</span>
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
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              {paymentType === 'OVERDUE_PENALTY'
                ? 'Hệ thống sẽ đối soát tự động trong 10-30 giây. Sau khi thanh toán thành công, nợ phạt sẽ được xóa và quyền Báo trả kho sẽ được mở lại ngay lập tức.'
                : 'Hệ thống sẽ đối soát tự động trong 10-30 giây và cấp ngay Thẻ nhận kho điện tử (Move-in Pass). Mã PIN mở khóa sẽ được kích hoạt tại quầy lễ tân.'}
            </span>
          </div>

          {/* Auto-Polling Status Badge (SC-03) */}
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

          {/* Cảnh báo khi kiểm tra mà chưa nhận được tiền */}
          {paymentNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2 shadow-2xs">
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

          {/* Action Buttons - Layout 2 tầng thoáng đãng, chuyên nghiệp */}
          <div className="space-y-2.5 pt-2">
            {!isPaid && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleSandboxTransfer}
                  disabled={isSimulating || isPaid || isInitializing || !orderCode}
                  className="w-full py-2.5 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 border border-emerald-300 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{isSimulating ? 'Đang chuyển tiền...' : isInitializing ? 'Đang tạo đơn...' : 'Xác nhận Sandbox tại chỗ'}</span>
                </Button>

                <a
                  href={checkoutData?.checkoutUrl || (orderCode ? `/payment/checkout?orderCode=${orderCode}` : '#')}
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
                onClick={handleClose}
                disabled={isVerifying}
                className="w-1/3 py-2.5 text-xs font-semibold cursor-pointer rounded-xl"
              >
                Đóng
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleCheckNow}
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
        </div>
      </div>
    </div>
  );
};
