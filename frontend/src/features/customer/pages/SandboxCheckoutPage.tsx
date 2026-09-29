import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { customerApi } from '../api/customerApi';
import { formatVND } from '../utils/pricing';
import { tokenStorage } from '@/utils/tokenStorage';

export const SandboxCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCodeParam = searchParams.get('orderCode');
  const orderCode = orderCodeParam ? parseInt(orderCodeParam, 10) : null;

  // Auth Guard: Mục 2 — Yêu cầu đăng nhập trước khi truy cập trang thanh toán Sandbox
  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [navigate]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!orderCode) {
      setErrorMsg('Không tìm thấy mã đơn hàng orderCode trên đường dẫn.');
      setIsLoading(false);
      return;
    }

    const fetchPayment = async () => {
      try {
        const res = await customerApi.getPaymentStatus(orderCode);
        setPaymentData(res);
        if (res?.status === 'SUCCESS') {
          setIsSuccess(true);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Không thể tải thông tin thanh toán.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayment();
  }, [orderCode]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateTransfer = async () => {
    if (!orderCode) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await customerApi.processSandboxTransfer(orderCode, 'TRANSFER_SUCCESS');
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/customer/my-units');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi xác nhận chuyển tiền giả lập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Đang tải cổng thanh toán Sandbox...</p>
        </div>
      </div>
    );
  }

  if (errorMsg && !paymentData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4 bg-white rounded-2xl shadow-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Lỗi giao dịch</h2>
          <p className="text-sm text-slate-600">{errorMsg}</p>
          <Button variant="primary" onClick={() => navigate('/customer/units')}>
            Quay lại đặt kho
          </Button>
        </Card>
      </div>
    );
  }

  const amount = paymentData?.amount || 2600000;
  const description = paymentData?.description || paymentData?.transferContent || `DH${orderCode}`;
  const bankAccount = paymentData?.bankAccountNumber || '0888567999';
  const bankName = paymentData?.bankName || 'MB Bank (Quân Đội · Napas247)';
  const accountHolder = paymentData?.accountName || 'CONG TY CP SMARTSTORAGE VIETNAM';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-4">
        {/* Brand Banner */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Cổng Giả Lập Ngân Hàng VietQR (Sandbox)
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">SmartStorage Payment Gateway</h1>
          {paymentData?.referenceType === 'OVERDUE_PENALTY' && (
            <div>
              <span className="inline-block text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full shadow-2xs">
                Thanh toán phí phạt nợ quá hạn (Hợp đồng #{paymentData.referenceId})
              </span>
            </div>
          )}
        </div>

        {/* Main Transfer Simulation Card */}
        <Card className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-amber-300" />
                <div>
                  <span className="text-xs uppercase tracking-wider text-blue-200 block font-semibold">Ngân hàng thụ hưởng</span>
                  <strong className="text-base font-bold text-white">{bankName}</strong>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold font-mono">
                24/7 FastPay
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex items-baseline justify-between">
              <span className="text-xs text-blue-100">Số tiền chuyển khoản:</span>
              <strong className="text-2xl font-black text-amber-300 tracking-tight">
                {formatVND(amount)}
              </strong>
            </div>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Account Details Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-mono font-bold text-slate-900 tracking-wider">{bankAccount}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankAccount)}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer"
                    title="Sao chép"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Tên người nhận:</span>
                <strong className="text-slate-900 font-bold uppercase text-right">{accountHolder}</strong>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Nội dung (Bắt buộc):</span>
                <strong className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-right">
                  {description}
                </strong>
              </div>
            </div>

            {/* Success state */}
            {isSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-emerald-950">Chuyển Tiền Thành Công!</h3>
                <p className="text-xs text-emerald-800">
                  Giao dịch đã được hệ thống ghi nhận. Đang chuyển hướng bạn tới trang Kho của tôi...
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/customer/my-units')}
                  >
                    Vào Kho của tôi ngay
                  </Button>
                </div>
              </div>
            ) : (
              /* Action Button */
              <div className="space-y-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full py-3.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  onClick={handleSimulateTransfer}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý giao dịch ngân hàng...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>XÁC NHẬN CHUYỂN KHOẢN THÀNH CÔNG</span>
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-slate-500 text-center italic">
                  * Đây là môi trường thử nghiệm Sandbox (không tốn tiền thật). Bấm nút trên để mô phỏng hoàn tất chuyển khoản 24/7.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
