import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  RefreshCw,
  X,
  Building,
  Box,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { createCheckout, pollPaymentStatus } from '@/api/payment';
import { apiClient } from '@/api/client';
import { VnpayPayLinks } from './VnpayPayLinks';
import type { RentedContract } from '../types';

export interface DirectContractPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  contract: RentedContract;
}

export const DirectContractPaymentModal: React.FC<DirectContractPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  contract,
}) => {
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [orderCode, setOrderCode] = useState<number | null>(contract.pendingInitialPaymentOrderCode ?? null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isMocking, setIsMocking] = useState(false);

  const rentalMonths = contract.rentalMonths || 1;
  const rentalFee = (contract.monthlyRent || 0) * rentalMonths;
  const deposit = contract.depositHeld || 0;
  const calculatedTotal = rentalFee + deposit;
  const totalAmount = contract.pendingInitialPaymentAmount && contract.pendingInitialPaymentAmount > 0
    ? contract.pendingInitialPaymentAmount
    : calculatedTotal;

  // Khởi tạo Checkout VNPay link
  useEffect(() => {
    if (!isOpen) {
      setIsPaid(false);
      setErrorNotice(null);
      return;
    }

    let isSubscribed = true;
    setLoadingCheckout(true);
    setErrorNotice(null);

    createCheckout({
      referenceType: 'DIRECT_CONTRACT',
      referenceId: Number(contract.id),
      amount: totalAmount,
      description: `HD${contract.id}`.slice(0, 25),
    })
      .then((res) => {
        if (!isSubscribed) return;
        if (res.orderCode) {
          setOrderCode(res.orderCode);
        }
      })
      .catch((err: any) => {
        if (!isSubscribed) return;
        console.warn('Lỗi khởi tạo checkout cho HĐ trực tiếp:', err);
        setErrorNotice(err?.message || 'Không thể tạo mã thanh toán VNPay. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (isSubscribed) setLoadingCheckout(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, contract.id, totalAmount]);

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
            onClose();
            onPaymentSuccess();
          }, 1500);
        }
      } catch (err) {
        console.warn('Auto-polling payment status error:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [orderCode, isPaid, isOpen, onClose, onPaymentSuccess]);

  // Kiểm tra trạng thái thanh toán thủ công
  const handleCheckNow = async () => {
    if (!orderCode || isVerifying || isPaid) return;
    setIsVerifying(true);
    setErrorNotice(null);
    try {
      const res = await pollPaymentStatus(orderCode);
      if (res.status === 'PAID' || res.status === 'SUCCESS') {
        setIsPaid(true);
        setTimeout(() => {
          onClose();
          onPaymentSuccess();
        }, 1200);
      } else {
        setErrorNotice('Hệ thống chưa nhận được tín hiệu thanh toán từ cổng VNPay. Nếu bạn đã hoàn tất giao dịch, vui lòng chờ 5-10 giây để hệ thống đối soát.');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Không thể kiểm tra giao dịch lúc này.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Giả lập thanh toán tức thì (Mock Pay cho môi trường Dev / Demo)
  const handleMockPay = async () => {
    if (!orderCode || isPaid || isMocking) return;
    setIsMocking(true);
    setErrorNotice(null);
    try {
      await apiClient<any>(`/payments/vnpay/mock-complete/${orderCode}`, {
        method: 'POST',
      });
      setIsPaid(true);
      setTimeout(() => {
        onClose();
        onPaymentSuccess();
      }, 1000);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Lỗi khi giả lập thanh toán.');
    } finally {
      setIsMocking(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#0d6050] text-white px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Thanh Toán Hợp Đồng Trực Tiếp</h3>
              <p className="text-xs text-emerald-100/80 font-medium">
                Cổng thanh toán VNPay Sandbox — Hợp đồng #{contract.contractNumber || contract.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Success Banner */}
          {isPaid && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in zoom-in-95">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Thanh toán thành công!</p>
                <p className="text-xs text-emerald-700">Hợp đồng đã kích hoạt. Đang chuyển hướng...</p>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Contract Metadata Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{contract.facilityName || 'Cơ sở lưu trữ'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Box className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-semibold text-slate-800">{contract.unitNumber || 'Ô kho đã gán'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 col-span-2">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  Thời hạn: <strong>{rentalMonths} tháng</strong> ({contract.startDate || 'Hôm nay'} → {contract.endDate || 'Hết hạn'})
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-500">Tổng thanh toán ban đầu (Thuê + Cọc):</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {formatVND(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method - VNPay Sandbox */}
          <div className="space-y-3">
            {loadingCheckout ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                Đang khởi tạo cổng VNPay...
              </div>
            ) : (
              <VnpayPayLinks orderCode={orderCode} />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Quick Mock Pay for Dev / Test Mode */}
          <button
            type="button"
            onClick={handleMockPay}
            disabled={isMocking || isPaid || !orderCode}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Giả lập thanh toán thành công tức thì"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-600 ${isMocking ? 'animate-bounce' : ''}`} />
            <span>⚡ Giả lập thanh toán thành công</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isVerifying}
              className="text-xs px-3.5 cursor-pointer font-semibold"
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCheckNow}
              disabled={isVerifying || isPaid || !orderCode}
              className="text-xs px-4 font-bold bg-[#0d6050] hover:bg-[#12836d] text-white cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Kiểm tra thanh toán ngay</span>
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
