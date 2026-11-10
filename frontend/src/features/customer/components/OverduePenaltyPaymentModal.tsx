import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Check,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import {
  createCheckout,
  pollPaymentStatus,
} from '@/api/payment';
import type { MoveInPassData } from '@/types';
import { VnpayPayLinks } from './VnpayPayLinks';

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
  const [isVerifying, setIsVerifying] = useState(false);
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
        if (res && res.orderCode) {
          setOrderCode(res.orderCode);
        } else {
          setPaymentNotice('Không thể khởi tạo mã giao dịch VNPay. Vui lòng thử lại sau.');
        }
      } catch (err: any) {
        console.warn('Lỗi khởi tạo checkout VNPay:', err);
        setPaymentNotice(err?.message || 'Không thể tạo mã giao dịch VNPay. Vui lòng đóng và thử lại sau ít phút!');
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

  // Auto-polling trạng thái giao dịch mỗi 3s
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

  // Kiểm tra trạng thái thủ công
  const handleCheckNow = async () => {
    if (!orderCode || isVerifying || isPaid) return;
    setIsVerifying(true);
    setPaymentNotice(null);
    try {
      const res = await pollPaymentStatus(orderCode);
      if (res.status === 'PAID' || res.status === 'SUCCESS') {
        setIsPaid(true);
        setTimeout(() => {
          handleClose();
          onPaymentSuccess();
        }, 800);
      } else {
        setPaymentNotice('Hệ thống chưa nhận được thông báo từ VNPay. Nếu bạn đã hoàn tất trên VNPay, vui lòng đợi 5-10 giây để hệ thống tự đối soát.');
      }
    } catch {
      setPaymentNotice('Không thể kiểm tra lúc này. Cổng thanh toán vẫn đang tự động cập nhật!');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0a1614] via-[#0d2320] to-[#0a1614] p-5 text-white relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight pr-8">
            {paymentType === 'SETTLEMENT'
              ? `Tất Toán Công Nợ Quyết Toán Ô Kho ${unitNumber}`
              : `Đóng Phí Quá Hạn & Mở PIN Tạm Ô Kho ${unitNumber}`}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            {facilityName} {contractId ? `· Hợp đồng #${contractId}` : ''}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Cảnh báo nợ phạt quá hạn / quyết toán */}
          <div className="bg-rose-50 border border-rose-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-900">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <span className="text-xs font-bold block">
                  {paymentType === 'SETTLEMENT'
                    ? 'Tất toán chi phí phát sinh / lưu Kho Tổng'
                    : 'Mở khóa mã PIN tạm thời & Quyền Báo trả kho'}
                </span>
                <span className="text-[11px] text-rose-700">
                  {paymentType === 'SETTLEMENT'
                    ? 'Thanh toán khoản thiếu hụt quyết toán để nhận lại tài sản và đóng hợp đồng'
                    : 'Tất toán phí quá hạn để nhận Mã PIN tạm đến 23:59 hôm nay và mở nút Báo trả kho'}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-base font-extrabold text-rose-700 tracking-wider">
                {formatVND(totalAmount)}
              </span>
              <span className="text-[10px] text-rose-600 block">
                {paymentType === 'SETTLEMENT' ? 'Công nợ quyết toán' : 'Phí quá hạn'}
              </span>
            </div>
          </div>

          {isPaid ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold">
                {paymentType === 'SETTLEMENT'
                  ? 'Thanh toán công nợ quyết toán thành công!'
                  : 'Thanh toán phí quá hạn thành công! Mã PIN tạm đã được mở khóa.'}
              </span>
            </div>
          ) : (
            <VnpayPayLinks orderCode={orderCode} />
          )}

          {/* Thông báo nếu có lỗi */}
          {paymentNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
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

          {/* Nút hành động */}
          <div className="flex items-center gap-2 pt-2">
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
    </div>,
    document.body
  );
};

