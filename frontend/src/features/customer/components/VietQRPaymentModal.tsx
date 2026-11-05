import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Check,
  ShieldCheck,
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
} from '@/api/payment';
import type { MoveInPassData } from '@/types';
import { tokenStorage } from '@/utils/tokenStorage';
import { VnpayPayLinks } from './VnpayPayLinks';

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
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [orderCode, setOrderCode] = useState<number | null>(null);
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

  // Khởi tạo PayOS checkout link khi modal mở
  useEffect(() => {
    if (!isOpen) {
      setOrderCode(null);
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

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto ${
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
                  <span className="text-xs font-bold block">Xử lý quá hạn hợp đồng</span>
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

          {!isPaid && <VnpayPayLinks orderCode={orderCode} />}

          {/* Financial Breakdown Table */}
          {paymentType === 'OVERDUE_PENALTY' ? (
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
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>
              {paymentType === 'OVERDUE_PENALTY'
                ? 'Hệ thống sẽ đối soát tự động trong 10-30 giây. Sau khi thanh toán thành công, nợ phạt sẽ được xóa và quyền Báo trả kho sẽ được mở lại ngay lập tức.'
                : 'Hệ thống sẽ đối soát tự động trong 10-30 giây và cấp ngay Thẻ nhận kho điện tử. Mã PIN mở khóa sẽ được kích hoạt tại quầy lễ tân.'}
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
                  ? 'Đang tạo mã thanh toán...'
                  : 'Đang chờ VNPay xác nhận giao dịch.'}
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
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleSandboxTransfer}
                disabled={isSimulating || isPaid || isInitializing || !orderCode}
                className="w-full py-2.5 px-3 text-xs font-bold"
              >
                {isSimulating ? 'Đang chuyển tiền...' : 'Xác nhận thử (sandbox nội bộ)'}
              </Button>
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
    </div>,
    document.body
  );
};
