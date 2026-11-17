import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CreditCard,
  Landmark,
  Loader2,
  X,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import {
  createCheckout,
  pollPaymentStatus,
} from '@/api/payment';
import type { MoveInPassData } from '@/types';
import { vnpayPayHref } from './VnpayPayLinks';

export interface OverduePenaltyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (passData?: MoveInPassData) => void;
  unitNumber: string;
  facilityName: string;
  totalAmount: number;
  contractId?: number;
  paymentType?: 'RESERVATION' | 'CONTRACT_RENEWAL' | 'OVERDUE_PENALTY' | 'SETTLEMENT';
}

export const OverduePenaltyPaymentModal: React.FC<OverduePenaltyPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  unitNumber,
  facilityName,
  totalAmount,
  contractId,
  paymentType = 'OVERDUE_PENALTY',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'VNBANK' | 'INTCARD'>('VNBANK');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [orderCode, setOrderCode] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Khởi tạo VNPay checkout khi mở modal
  useEffect(() => {
    if (!isOpen) {
      setOrderCode(null);
      setIsPaid(false);
      setPaymentNotice(null);
      setIsClosing(false);
      setIsRedirecting(false);
      setSelectedMethod('VNBANK');
      return;
    }

    const initCheckout = async () => {
      setIsInitializing(true);
      try {
        const res = await createCheckout({
          referenceType: paymentType,
          referenceId: contractId || 0,
          amount: totalAmount,
          description: `NO PHAT KHO ${unitNumber}`.slice(0, 25),
        });
        const checkoutData = (res as any)?.data || res;
        const code = checkoutData?.orderCode || checkoutData?.id;
        if (code) {
          setOrderCode(Number(code));
        } else {
          setPaymentNotice('Không thể khởi tạo phiên thanh toán VNPay. Vui lòng thử lại sau.');
        }
      } catch (err: any) {
        console.warn('Lỗi khởi tạo checkout VNPay:', err);
        setPaymentNotice(err?.message || 'Không thể kết nối cổng thanh toán VNPay. Vui lòng thử lại sau ít phút.');
      } finally {
        setIsInitializing(false);
      }
    };

    initCheckout();
  }, [isOpen, paymentType, contractId, totalAmount, unitNumber]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Tự động chạy ngầm đối soát trạng thái thanh toán (Seamless Polling)
  useEffect(() => {
    if (!orderCode || isPaid || !isOpen) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await pollPaymentStatus(orderCode);
        if (res.status === 'PAID' || res.status === 'SUCCESS') {
          setIsPaid(true);
          clearInterval(intervalId);
          setTimeout(() => {
            handleClose();
            onPaymentSuccess();
          }, 1000);
        }
      } catch (err) {
        console.error('Lỗi auto-polling payment status:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [orderCode, isPaid, isOpen, onPaymentSuccess]);

  const handleProceedPayment = () => {
    if (!orderCode || isPaid || isInitializing || isRedirecting) return;
    setPaymentNotice(null);
    setIsRedirecting(true);
    window.location.href = vnpayPayHref(orderCode, selectedMethod);
  };

  if (!isOpen) return null;

  const isSettlement = paymentType === 'SETTLEMENT';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* 1. Header Modal sáng sủa, thông tin ngữ cảnh rõ ràng */}
        <div className="px-6 py-5 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {isSettlement
                  ? 'Tất toán công nợ quyết toán'
                  : 'Đóng phí quá hạn & Mở khóa PIN'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Ô kho: <span className="font-semibold text-gray-700">{unitNumber}</span> · {facilityName}
                {contractId ? ` · Hợp đồng: #${contractId}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng cửa sổ"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Nội dung chính: Cảnh báo phẳng, Chọn phương thức Radio & Chi tiết phí */}
        <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Cảnh báo viền trái nhẹ nhàng */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              <p className="font-bold mb-0.5">
                {isSettlement
                  ? 'Hợp đồng còn khoản thiếu hụt quyết toán cần tất toán.'
                  : 'Mã PIN đang bị khóa do quá hạn thanh toán.'}
              </p>
              <p>
                {isSettlement
                  ? 'Vui lòng hoàn tất thanh toán để nhận lại tài sản và đóng hợp đồng.'
                  : <>Sau khi thanh toán thành công, mã PIN sẽ được mở khóa tạm thời đến <strong>23:59 hôm nay</strong> để bạn dọn đồ và báo trả kho.</>}
              </p>
            </div>
          </div>

          {isPaid ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                {isSettlement
                  ? 'Thanh toán công nợ quyết toán thành công.'
                  : 'Thanh toán phí quá hạn thành công. Mã PIN tạm đã được mở khóa.'}
              </span>
            </div>
          ) : (
            <>
              {/* Chọn phương thức thanh toán VNPay dạng Radio phẳng */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
                  Chọn phương thức thanh toán qua VNPay
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`relative flex cursor-pointer rounded-lg border bg-white p-3.5 transition-all ${
                      selectedMethod === 'VNBANK'
                        ? 'border-brand-500 ring-1 ring-brand-500 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <input
                        type="radio"
                        name="overdue-vnpay-method"
                        value="VNBANK"
                        checked={selectedMethod === 'VNBANK'}
                        onChange={() => setSelectedMethod('VNBANK')}
                        className="mt-1 h-4 w-4 accent-brand-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                          <Landmark className="w-4 h-4 text-brand-600 shrink-0" />
                          <span>Thẻ ATM / Tài khoản nội địa</span>
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          Hỗ trợ 40+ ngân hàng VN
                        </span>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`relative flex cursor-pointer rounded-lg border bg-white p-3.5 transition-all ${
                      selectedMethod === 'INTCARD'
                        ? 'border-brand-500 ring-1 ring-brand-500 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <input
                        type="radio"
                        name="overdue-vnpay-method"
                        value="INTCARD"
                        checked={selectedMethod === 'INTCARD'}
                        onChange={() => setSelectedMethod('INTCARD')}
                        className="mt-1 h-4 w-4 accent-brand-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                          <CreditCard className="w-4 h-4 text-gray-600 shrink-0" />
                          <span>Thẻ Quốc tế</span>
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          Visa / Mastercard / JCB
                        </span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Chi tiết phí gọn gàng */}
              <div className="pt-4 border-t border-gray-100 space-y-2 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi tiết phí</p>
                <div className="flex items-center justify-between text-gray-700">
                  <span>{isSettlement ? 'Khoản thiếu hụt quyết toán' : 'Phí phạt quá hạn lưu kho'}</span>
                  <span className="font-semibold text-gray-900 tabular-nums">{formatVND(totalAmount)}</span>
                </div>
              </div>
            </>
          )}

          {/* Thông báo lỗi nếu khởi tạo VNPay thất bại */}
          {paymentNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between gap-2">
              <span>{paymentNotice}</span>
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

        {/* 3. Footer: Tổng tiền nổi bật + Hành động chính Thanh toán qua VNPay */}
        <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Tổng cần thanh toán:</span>
            <span className="text-2xl font-bold text-rose-600 tabular-nums">
              {formatVND(totalAmount)}
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isRedirecting}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleProceedPayment}
              disabled={isInitializing || isRedirecting || isPaid || !orderCode}
              className="px-6 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo VNPay...</span>
                </>
              ) : isRedirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang chuyển hướng sang VNPay...</span>
                </>
              ) : isPaid ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã thanh toán thành công</span>
                </>
              ) : (
                <>
                  <span>Thanh toán qua VNPay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
