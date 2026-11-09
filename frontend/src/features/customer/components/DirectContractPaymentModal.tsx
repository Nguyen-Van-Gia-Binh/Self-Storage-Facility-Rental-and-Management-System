import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import {
  CreditCard,
  QrCode,
  Check,
  RefreshCw,
  X,
  Copy,
  Building,
  Box,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import { createCheckout, pollPaymentStatus, type CheckoutResult } from '@/api/payment';
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
  const [activeTab, setActiveTab] = useState<'VIETQR' | 'VNPAY'>('VIETQR');
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [orderCode, setOrderCode] = useState<number | null>(contract.pendingInitialPaymentOrderCode ?? null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isMocking, setIsMocking] = useState(false);

  const rentalMonths = contract.rentalMonths || 1;
  const rentalFee = (contract.monthlyRent || 0) * rentalMonths;
  const deposit = contract.depositHeld || 0;
  const calculatedTotal = rentalFee + deposit;
  const totalAmount = contract.pendingInitialPaymentAmount && contract.pendingInitialPaymentAmount > 0
    ? contract.pendingInitialPaymentAmount
    : calculatedTotal;

  // Khởi tạo Checkout (VietQR & VNPay link)
  useEffect(() => {
    if (!isOpen) {
      setCheckoutData(null);
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
        setCheckoutData(res);
        if (res.orderCode) {
          setOrderCode(res.orderCode);
        }
      })
      .catch((err: any) => {
        if (!isSubscribed) return;
        console.warn('Lỗi khởi tạo checkout cho HĐ trực tiếp:', err);
        setErrorNotice(err?.message || 'Không thể tạo mã thanh toán. Vui lòng thử lại sau.');
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
        }, 1500);
      } else {
        setErrorNotice('Hệ thống chưa nhận được khoản chuyển. Vui lòng kiểm tra lại tài khoản ngân hàng của bạn hoặc thử lại sau 30 giây.');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Lỗi khi kiểm tra trạng thái thanh toán');
    } finally {
      setIsVerifying(false);
    }
  };

  // Giả lập thanh toán thành công (Thử nghiệm Dev/Sandbox)
  const handleMockPay = async () => {
    if (!orderCode) return;
    try {
      setIsMocking(true);
      await apiClient<any>(`/payments/vnpay/mock-complete/${orderCode}`, {
        method: 'POST',
      });
      setIsPaid(true);
      setTimeout(() => {
        onClose();
        onPaymentSuccess();
      }, 1500);
    } catch (err: any) {
      setErrorNotice(err?.message || 'Lỗi khi giả lập thanh toán');
    } finally {
      setIsMocking(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-gradient-to-r from-teal-800 to-emerald-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Thanh toán Hợp đồng Thuê kho</h3>
              <p className="text-xs text-teal-100 font-medium">
                Mã HĐ: <span className="font-mono font-bold text-white">{contract.contractNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700">
          {/* Success Banner */}
          {isPaid && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-500 rounded-2xl flex items-center gap-3.5 text-emerald-950 animate-in fade-in">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-emerald-900">Thanh toán thành công!</h4>
                <p className="text-xs text-emerald-800">
                  Hợp đồng đã được kích hoạt thành công. Quý khách có thể check-in và nhận mã PIN mở kho.
                </p>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorNotice && !isPaid && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorNotice}</div>
            </div>
          )}

          {/* Unit & Contract Info Card */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cơ sở</span>
                <span className="font-semibold text-slate-800">{contract.facilityName}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ô kho & Loại kho</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {contract.unitNumber} • {contract.unitTypeName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 col-span-2 pt-2 border-t border-slate-200/60">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Thời hạn thuê</span>
                <span className="font-semibold text-slate-800">
                  {contract.startDate} → {contract.endDate} ({rentalMonths} tháng)
                </span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/90 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tiền đặt cọc bảo đảm (1 tháng):</span>
              <span className="font-semibold font-mono text-slate-800">{formatVND(deposit)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tiền thuê {rentalMonths} tháng ({formatVND(contract.monthlyRent || 0)}/tháng):</span>
              <span className="font-semibold font-mono text-slate-800">{formatVND(rentalFee)}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
              <span className="text-sm font-black text-emerald-950">Tổng thanh toán ban đầu:</span>
              <span className="text-lg font-black font-mono text-emerald-700">
                {formatVND(totalAmount)}
              </span>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div className="space-y-3">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('VIETQR')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'VIETQR'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4 text-teal-600" />
                <span>Quét mã VietQR chuyển khoản</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VNPAY')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'VNPAY'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Cổng VNPay Sandbox</span>
              </button>
            </div>

            {/* TAB 1: VIETQR */}
            {activeTab === 'VIETQR' && (
              <div className="space-y-4">
                {loadingCheckout ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Đang tạo mã VietQR chuyển khoản...
                  </div>
                ) : checkoutData?.qrCode ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-5">
                    {/* QR Code Image */}
                    <div className="p-2 bg-white rounded-xl border border-slate-200 shrink-0 shadow-2xs text-center">
                      <img
                        src={checkoutData.qrCode}
                        alt="VietQR Code"
                        className="w-36 h-36 object-contain rounded-lg mx-auto"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                        Mở App Ngân hàng quét QR
                      </span>
                    </div>

                    {/* Bank Info */}
                    <div className="flex-1 space-y-2 text-xs w-full">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Ngân hàng:</span>
                        <span className="font-bold text-slate-800">
                          {checkoutData.accountName?.includes('MB') ? 'MB Bank' : 'Techcombank / Napas'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Số tài khoản:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span>{checkoutData.accountNumber || '0868268970'}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(checkoutData.accountNumber || '0868268970', 'acc')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-teal-600 transition-colors cursor-pointer"
                            title="Sao chép số tài khoản"
                          >
                            {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Chủ tài khoản:</span>
                        <span className="font-bold text-slate-800 uppercase">
                          {checkoutData.accountName || 'CONG TY CP SMARTSTORAGE'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-400 font-medium">Nội dung chuyển khoản:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                          <span>{checkoutData.description || `HD${contract.id}`}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(checkoutData.description || `HD${contract.id}`, 'memo')}
                            className="p-0.5 hover:bg-teal-100 rounded text-teal-600 transition-colors cursor-pointer"
                            title="Sao chép nội dung"
                          >
                            {copiedField === 'memo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                    Vui lòng chọn cổng VNPay bên cạnh để thanh toán hoặc kiểm tra lại kết nối.
                  </div>
                )}

                <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                  <span>Hệ thống đang tự động kiểm tra giao dịch (Auto-polling mỗi 3s)...</span>
                </div>
              </div>
            )}

            {/* TAB 2: VNPAY SANDBOX */}
            {activeTab === 'VNPAY' && (
              <div className="space-y-4">
                <VnpayPayLinks orderCode={orderCode} />
              </div>
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
            title="Giả lập thanh toán thành công tức thì cho môi trường thử nghiệm"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-600 ${isMocking ? 'animate-bounce' : ''}`} />
            <span>⚡ Giả lập thanh toán thành công (Test)</span>
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
