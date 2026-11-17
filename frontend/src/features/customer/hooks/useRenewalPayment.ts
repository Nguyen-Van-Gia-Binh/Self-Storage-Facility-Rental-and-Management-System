import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getCustomerContracts,
  waitForAppliedRenewal,
} from '@/api/customerRentals';
import { customerApi, type CheckoutResponse } from '../api/customerApi';
import type { RentedContract, RenewContractResponse } from '../types';

interface UseRenewalPaymentParams {
  contract: RentedContract | null;
  currentStep: 1 | 2 | 3;
  renewalMonths: number;
  /** Thời gian giữ lệnh thanh toán (giờ) theo BOM Policy; chỉ dùng khi server không trả expiresAt */
  holdHours: number;
  /** orderCode từ URL (?orderCode=...) — khôi phục phiên thanh toán khi reload */
  urlOrderCode: string | null;
  /** Báo xung đột lịch đặt trước (CAPACITY_NOT_AVAILABLE) lên Conflict View của page */
  onCapacityConflict: (message: string) => void;
  /** Báo hợp đồng mới (đã gia hạn) để page cập nhật state contract (BR-REN-04) */
  onRenewalApplied: (updated: RentedContract) => void;
  /** Yêu cầu page reset về Bước 1 sau khi hủy lệnh thanh toán */
  onRequestStepReset: () => void;
  /** Đồng bộ orderCode lên URL khi khởi tạo phiên Bước 3 để F5 / quay lại giữ nguyên đồng hồ real-time */
  onOrderCodeReady?: (orderCode: number) => void;
}

function parseValidDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Khối thanh toán gia hạn qua VNPay Sandbox Napas247 (SC-03, BR-REN-04/05).
 * - Khởi tạo / tái sử dụng lệnh thanh toán CONTRACT_RENEWAL khi vào Bước 3
 * - Đồng bộ real-time `expiresAt` trực tiếp từ Server DB (CheckoutResponse / PaymentStatus / contract.pendingRenewalExpiresAt)
 *   để thoát ra vào lại hoặc F5 KHÔNG bao giờ bị reset đồng hồ
 * - Polling trạng thái mỗi 2.5s, hủy lệnh, kích hoạt hợp đồng + E-Receipt
 */
export function useRenewalPayment({
  contract,
  currentStep,
  renewalMonths,
  holdHours,
  urlOrderCode,
  onCapacityConflict,
  onRenewalApplied,
  onRequestStepReset,
  onOrderCodeReady,
}: UseRenewalPaymentParams) {
  // --- State: lệnh thanh toán & đối soát ---
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(() => {
    return urlOrderCode ? ({ orderCode: Number(urlOrderCode) } as CheckoutResponse) : null;
  });
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  // --- State: kích hoạt hợp đồng + E-Receipt ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [renewalResult, setRenewalResult] = useState<RenewContractResponse | null>(null);
  const [confirmedRenewal, setConfirmedRenewal] = useState<{
    newEndDate: string;
    renewalMonths: number;
    totalPaid: number;
  } | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // --- State: countdown real-time theo mốc expiresAt của server ---
  const [serverStatusExpiresAt, setServerStatusExpiresAt] = useState<string | null>(null);
  const [fallbackExpiresAt, setFallbackExpiresAt] = useState<Date | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // --- State: hủy lệnh ---
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- State: copy thông tin tài khoản ---
  const [copiedBankInfo, setCopiedBankInfo] = useState<string | null>(null);

  // Đồng bộ orderCode từ contract.pendingRenewalOrderCode nếu người dùng rời trang và quay lại /customer/renew/:id
  useEffect(() => {
    if (
      currentStep === 3 &&
      !checkoutData?.orderCode &&
      contract?.hasPendingRenewal &&
      contract?.pendingRenewalOrderCode
    ) {
      setCheckoutData({
        orderCode: contract.pendingRenewalOrderCode,
        expiresAt: contract.pendingRenewalExpiresAt,
      } as CheckoutResponse);
    }
  }, [currentStep, checkoutData?.orderCode, contract]);

  // Đọc hạn mới do backend ghi một lần khi thanh toán thành công (BR-REN-04).
  const executeRenewalActivation = useCallback(async () => {
    if (!contract) return;
    setIsProcessing(true);

    try {
      const applied = await waitForAppliedRenewal(Number(contract.id), contract.endDate);
      const refreshedList = await getCustomerContracts();
      const refreshed = refreshedList.find((item) => item.id === contract.id);
      const endDate = applied.newEndDate.slice(0, 10);
      const updatedContract: RentedContract = {
        ...(refreshed || contract),
        endDate,
        status: refreshed?.status || contract.status,
        overdueDays: 0,
        overdueFee: 0,
      };

      onRenewalApplied(updatedContract);
      setConfirmedRenewal({
        newEndDate: endDate,
        renewalMonths: applied.renewalMonths,
        totalPaid: applied.totalPaid,
      });
      setRenewalResult({
        success: true,
        contract: updatedContract,
        receiptNumber: `REN-${applied.id}`,
        renewedAt: applied.createdAt || new Date().toISOString(),
        message: `Gia hạn thành công thêm ${applied.renewalMonths} tháng cho ô kho ${updatedContract.unitNumber}. Hạn mới đến ngày ${endDate}.`,
      });
      setIsProcessing(false);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Lỗi khi đọc kết quả gia hạn:', err);
      setIsProcessing(false);
      setPaymentNotice('Thanh toán đã ghi nhận nhưng chưa đọc được hạn mới. Vui lòng tải lại trang hợp đồng.');
    }
  }, [contract, onRenewalApplied]);

  // Khởi tạo / tái sử dụng link thanh toán VNPay Sandbox khi chuyển sang Bước 3
  useEffect(() => {
    if (currentStep !== 3 || !contract || checkoutData?.orderCode) return;

    let isMounted = true;
    const initVnpay = async () => {
      setIsLoadingCheckout(true);
      setCheckoutError(null);
      try {
        if (contract.status === 'PENDING_RETURN') {
          throw new Error('Hợp đồng đang ở trạng thái chờ nghiệm thu trả kho. Vui lòng hủy yêu cầu trả kho trước nếu muốn gia hạn.');
        }
        if (contract.status === 'OVERDUE') {
          throw new Error('Hợp đồng đã quá hạn (máy trạng thái một chiều theo BR-REN-06) không thể tự gia hạn trực tuyến. Quý khách vui lòng thanh toán nợ quá hạn để mở PIN tạm và thực hiện Báo trả kho.');
        }
        if (contract.status !== 'ACTIVE') {
          throw new Error(`Hợp đồng đang ở trạng thái "${contract.status}". Chỉ hợp đồng đang hoạt động (ACTIVE) mới được phép tự gia hạn trực tuyến.`);
        }

        const numId = parseInt(contract.id, 10);
        const refId = !isNaN(numId) && numId > 0 ? numId : 1;

        const checkout = await customerApi.createPaymentCheckout({
          referenceType: 'CONTRACT_RENEWAL',
          referenceId: refId,
          renewalMonths: renewalMonths,
          description: `GH${refId}T${renewalMonths}`.slice(0, 25),
        });

        if (isMounted) {
          setCheckoutData(checkout);
          if (checkout.orderCode && onOrderCodeReady) {
            onOrderCodeReady(checkout.orderCode);
          }
        }
      } catch (err: unknown) {
        console.warn('Lỗi khởi tạo VNPay cho hợp đồng:', err);
        const code = (err as any)?.errorCode || (err as any)?.data?.errorCode;
        const msg =
          err instanceof Error
            ? err.message
            : 'Không thể kết nối cổng thanh toán VNPay. Vui lòng kiểm tra lại kết nối!';
        if (isMounted) {
          if (code === 'CAPACITY_NOT_AVAILABLE' || msg.includes('đặt trước')) {
            onCapacityConflict(msg);
          }
          setCheckoutError(msg);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCheckout(false);
        }
      }
    };

    initVnpay();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, contract, renewalMonths]);

  // Kiểm tra trạng thái thanh toán & đồng bộ expiresAt ngay khi vào Bước 3 + Polling mỗi 2.5s
  useEffect(() => {
    if (currentStep !== 3 || !checkoutData?.orderCode || isPaidSuccess) return;

    let cancelled = false;
    const syncPaymentStatus = async () => {
      try {
        const statusRes = await customerApi.getPaymentStatus(checkoutData.orderCode);
        if (cancelled) return;

        if (statusRes.expiresAt) {
          setServerStatusExpiresAt(statusRes.expiresAt);
        } else if (statusRes.createdAt && holdHours > 0) {
          const created = parseValidDate(statusRes.createdAt);
          if (created) {
            setServerStatusExpiresAt(
              new Date(created.getTime() + holdHours * 60 * 60 * 1000).toISOString()
            );
          }
        }

        if (statusRes.status === 'SUCCESS') {
          setIsPaidSuccess(true);
          executeRenewalActivation();
        }
      } catch {
        // Tiếp tục polling
      }
    };

    syncPaymentStatus();
    const interval = setInterval(syncPaymentStatus, 2500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentStep, checkoutData?.orderCode, isPaidSuccess, holdHours, executeRenewalActivation]);

  // Kiểm tra thanh toán chủ động
  const handleCheckPaymentAndRenew = async () => {
    if (!checkoutData?.orderCode) return;
    setIsVerifying(true);
    setPaymentNotice(null);
    try {
      const statusRes = await customerApi.getPaymentStatus(checkoutData.orderCode);
      if (statusRes.expiresAt) {
        setServerStatusExpiresAt(statusRes.expiresAt);
      }
      if (statusRes.status === 'SUCCESS') {
        setIsPaidSuccess(true);
        await executeRenewalActivation();
      } else {
        setPaymentNotice('Hệ thống chưa ghi nhận thanh toán. Vui lòng hoàn tất chuyển khoản trước khi xác nhận!');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra đối soát thanh toán gia hạn:', err);
      setPaymentNotice('Không thể kiểm tra đối soát thanh toán lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Mốc hết hạn thực từ server (ưu tiên tuyệt đối dữ liệu server, không bao giờ bị race-condition reset về Date.now() + holdHours)
  const authoritativeExpiresAt = useMemo(() => {
    return (
      parseValidDate(checkoutData?.expiresAt) ||
      parseValidDate(serverStatusExpiresAt) ||
      parseValidDate(contract?.pendingRenewalExpiresAt)
    );
  }, [checkoutData?.expiresAt, serverStatusExpiresAt, contract?.pendingRenewalExpiresAt]);

  // Fallback chỉ chạy khi đã có contract & checkoutData xong mà server không trả trường expiresAt (ví dụ test mock cũ)
  useEffect(() => {
    if (authoritativeExpiresAt) {
      setFallbackExpiresAt(null);
      return;
    }
    if (
      currentStep === 3 &&
      checkoutData?.orderCode &&
      contract &&
      !isLoadingCheckout &&
      !fallbackExpiresAt &&
      holdHours > 0
    ) {
      setFallbackExpiresAt(new Date(Date.now() + holdHours * 60 * 60 * 1000));
    }
  }, [
    authoritativeExpiresAt,
    currentStep,
    checkoutData?.orderCode,
    contract,
    isLoadingCheckout,
    fallbackExpiresAt,
    holdHours,
  ]);

  const effectiveExpiresAt = authoritativeExpiresAt || fallbackExpiresAt;

  // Bộ đếm ngược thời gian thực tính đồng bộ theo effectiveExpiresAt - nowMs (không nhấp nháy 00:00:00 khi mount)
  useEffect(() => {
    if (currentStep !== 3 || !effectiveExpiresAt) return;

    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, effectiveExpiresAt]);

  const countdownSeconds = effectiveExpiresAt
    ? Math.max(0, Math.floor((effectiveExpiresAt.getTime() - nowMs) / 1000))
    : 0;

  const isSessionExpired = Boolean(
    currentStep === 3 && effectiveExpiresAt && effectiveExpiresAt.getTime() <= nowMs && !isPaidSuccess
  );

  // Format đếm ngược dạng đồng hồ giờ:phút:giây (hh:mm:ss)
  const formatCountdown = (secs: number) => {
    const s = Math.max(0, secs);
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const remainingSecs = s % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // --- Hủy lệnh thanh toán: hủy đơn tại cổng rồi reset về Bước 1 ---
  const handleCancelPayment = async () => {
    const code = checkoutData?.orderCode || (urlOrderCode ? Number(urlOrderCode) : null);
    setIsCancelling(true);
    try {
      if (code) {
        await customerApi.cancelPaymentOrder(code);
      }
    } catch (err) {
      console.warn('Lỗi khi hủy đơn thanh toán:', err);
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
      resetPaymentOrder();
      onRequestStepReset();
    }
  };

  const resetPaymentOrder = () => {
    setCheckoutData(null);
    setServerStatusExpiresAt(null);
    setFallbackExpiresAt(null);
  };

  // --- Nội dung chuyển khoản + copy ---
  const transferContent = useMemo(() => {
    if (!contract) return 'GIAHAN KHO';
    const contractCode = contract.contractNumber.replace(/\D/g, '').slice(-6) || contract.id.slice(-6);
    return `GIAHAN ${contract.unitNumber} ${contractCode}`.toUpperCase();
  }, [contract]);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(type);
    setTimeout(() => setCopiedBankInfo(null), 2000);
  };

  return {
    // Lệnh thanh toán
    checkoutData,
    isLoadingCheckout,
    checkoutError,
    isPaidSuccess,
    isVerifying,
    paymentNotice,
    setPaymentNotice,
    isCancelling,
    showCancelDialog,
    setShowCancelDialog,
    // Countdown real-time
    countdownSeconds,
    isSessionExpired,
    formatCountdown,
    // Kích hoạt + E-Receipt
    isProcessing,
    renewalResult,
    confirmedRenewal,
    showReceiptModal,
    setShowReceiptModal,
    // Handlers
    handleCheckPaymentAndRenew,
    handleCancelPayment,
    resetPaymentOrder,
    transferContent,
    copiedBankInfo,
    handleCopy,
  };
}
