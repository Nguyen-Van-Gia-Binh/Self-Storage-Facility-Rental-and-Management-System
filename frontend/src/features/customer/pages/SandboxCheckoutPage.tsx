import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { customerApi } from '../api/customerApi';
import { formatVND } from '../utils/pricing';
import { VnpayPayLinks } from '../components/VnpayPayLinks';
import { tokenStorage } from '@/utils/tokenStorage';

const FAILED_TEXT = 'Thanh toán không thành công hoặc đã bị hủy. Vui lòng thử lại.';

export const SandboxCheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCodeParam = searchParams.get('orderCode');
  const orderCode = orderCodeParam ? parseInt(orderCodeParam, 10) : null;
  const result = searchParams.get('result');

  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [navigate]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (!orderCode) {
      setErrorMsg('Không tìm thấy mã đơn hàng.');
      setIsLoading(false);
      return;
    }

    let pollCount = 0;
    let timeoutId: any = null;
    let isMounted = true;

    const checkStatus = () => {
      customerApi.getPaymentStatus(orderCode)
        .then((res) => {
          if (!isMounted) return;
          setPaymentData(res);
          // Lớp 2 (Immediate Fallback): Nếu giao dịch đang PENDING, tự động polling mỗi 3s (tối đa 5 lần)
          if (res?.status === 'PENDING' && pollCount < 5 && result !== 'failed') {
            pollCount++;
            timeoutId = setTimeout(checkStatus, 3000);
          }
        })
        .catch((err: any) => {
          if (!isMounted) return;
          setErrorMsg(err?.message || 'Không thể tải thông tin thanh toán.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    checkStatus();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderCode, result]);

  const paid = paymentData?.status === 'SUCCESS';
  const failed = !paid && result === 'failed';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Đang kiểm tra kết quả VNPay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 bg-white border border-slate-200 rounded-2xl shadow-none space-y-4">
        <h1 className="text-lg font-bold text-slate-900">Thanh toán VNPay</h1>
        {errorMsg && !paymentData && (
          <p className="text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMsg}</span>
          </p>
        )}
        {paid ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Thanh toán thành công{paymentData?.amount ? ` ${formatVND(paymentData.amount)}` : ''}.</span>
            </p>
            <Button variant="primary" className="w-full" onClick={() => navigate('/customer/my-units')}>
              Vào Kho của tôi
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {failed && <p className="text-sm text-rose-700">{FAILED_TEXT}</p>}
            <VnpayPayLinks orderCode={orderCode} />
          </div>
        )}
      </Card>
    </div>
  );
};
