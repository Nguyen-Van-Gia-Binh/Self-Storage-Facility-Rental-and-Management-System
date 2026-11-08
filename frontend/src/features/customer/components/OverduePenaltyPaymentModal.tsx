import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Check,
  ShieldCheck,
  RefreshCw,
  X,
  CreditCard,
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              VNPay Sandbox
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
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
                    : 'Mở khóa mã PIN tạm thời & Quyền Báo trả kho (BR-OVD-08)'}
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
                {paymentType === 'SETTLEMENT' ? 'Công nợ quyết toán' : 'Phí quá hạn lũy kế'}
              </span>
            </div>
          </div>

          {/* Component chọn cổng VNPay */}
          {!isPaid && <VnpayPayLinks orderCode={orderCode} />}

          {/* Bảng chi tiết khoản nộp */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>
                {paymentType === 'SETTLEMENT'
                  ? 'Chi phí phát sinh / lưu Kho Tổng cần thanh toán:'
                  : 'Phí lưu kho / phạt quá hạn tích lũy:'}
              </span>
              <span className="font-bold text-rose-600">{formatVND(totalAmount)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-900">Tổng tiền cần thanh toán:</span>
              <span className="font-extrabold text-base text-rose-600">{formatVND(totalAmount)}</span>
            </div>
          </div>

          {/* Bảo mật */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {paymentType === 'SETTLEMENT'
                ? 'Hệ thống đối soát tự động qua VNPay/VietQR. Sau khi thanh toán thành công, hợp đồng sẽ được tự động đóng (CLOSED) và bạn có thể nhận lại tài sản tại Kho Tổng.'
                : 'Hệ thống đối soát tự động qua VNPay/VietQR. Ngay khi thanh toán thành công, nợ quá hạn được xóa về 0, hệ thống cấp Mã PIN tạm thời hiệu lực đến 23:59 hôm nay để bạn vào dọn đồ và mở khóa nút Báo trả kho.'}
            </span>
          </div>

          {/* Trạng thái đối soát tự động */}
          <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-emerald-600 ${isPaid ? '' : 'animate-spin'}`} />
              <span className="font-medium">
                {isPaid
                  ? 'Thanh toán nợ phạt thành công!'
                  : isInitializing
                  ? 'Đang kết nối cổng VNPay...'
                  : 'Đang chờ VNPay xác nhận thanh toán.'}
              </span>
            </div>
            {orderCode && (
              <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-bold shrink-0">
                Mã: #{orderCode}
              </span>
            )}
          </div>

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

