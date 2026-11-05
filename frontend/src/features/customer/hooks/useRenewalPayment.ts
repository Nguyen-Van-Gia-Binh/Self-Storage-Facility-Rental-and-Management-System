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
  /** Thời gian giữ lệnh thanh toán (giờ) theo BOM Policy; 0 = tính theo contract.pendingRenewalExpiresAt */
  holdHours: number;
  /** orderCode từ URL (?orderCode=...) — khôi phục phiên thanh toán khi reload */
  urlOrderCode: string | null;
  /** Báo xung đột lịch đặt trước (CAPACITY_NOT_AVAILABLE) lên Conflict View của page */
  onCapacityConflict: (message: string) => void;
  /** Báo hợp đồng mới (đã gia hạn) để page cập nhật state contract (BR-REN-04) */
  onRenewalApplied: (updated: RentedContract) => void;
  /** Yêu cầu page reset về Bước 1 sau khi hủy lệnh thanh toán */
  onRequestStepReset: () => void;
}

/**
 * Khối thanh toán gia hạn qua VNPay Sandbox Napas247 (SC-03, BR-REN-04/05).
 * - Khởi tạo lệnh thanh toán CONTRACT_RENEWAL khi vào Bước 3
 * - Polling trạng thái mỗi 2.5s, countdown 48h, sandbox dev bar, hủy lệnh
 * - Khi tất toán: đọc hạn mới đã áp dụng (BR-REN-04) → kích hoạt hợp đồng + E-Receipt
 * Tách từ `RenewalPage` để page chỉ còn giữ navigation + JSX.
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

  // --- State: countdown 48h ---
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [paymentExpiresAt, setPaymentExpiresAt] = useState<Date | null>(null);

  // --- State: sandbox dev + hủy lệnh ---
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // --- State: copy thông tin tài khoản ---
  const [copiedBankInfo, setCopiedBankInfo] = useState<string | null>(null);

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
        status: 'ACTIVE',
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

  // Khởi tạo link thanh toán VNPay Sandbox khi chuyển sang Bước 3
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
          const fee = contract.overdueFee ?? 0;
          if (fee > 0) {
            throw new Error('Hợp đồng đang có nợ phạt quá hạn. Vui lòng thanh toán nợ phạt trước khi gia hạn.');
          }
        } else if (contract.status !== 'ACTIVE') {
          throw new Error(`Hợp đồng đang ở trạng thái "${contract.status}". Chỉ hợp đồng ACTIVE hoặc OVERDUE đã tất toán nợ mới được phép gia hạn.`);
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

  // Kiểm tra thanh toán chủ động (Nút "Tôi đã hoàn tất chuyển khoản")
  const handleCheckPaymentAndRenew = async () => {
    if (!checkoutData?.orderCode) return;
    setIsVerifying(true);
    setPaymentNotice(null);
    try {
      const statusRes = await customerApi.getPaymentStatus(checkoutData.orderCode);
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

  // Polling tự động kiểm tra trạng thái thanh toán mỗi 2.5 giây khi ở Bước 3
  useEffect(() => {
    if (currentStep !== 3 || !checkoutData?.orderCode || isPaidSuccess) return;

    const interval = setInterval(async () => {
      try {
        const statusRes = await customerApi.getPaymentStatus(checkoutData.orderCode);
        if (statusRes.status === 'SUCCESS') {
          clearInterval(interval);
          setIsPaidSuccess(true);
          executeRenewalActivation();
        }
      } catch {
        // Tiếp tục polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentStep, checkoutData?.orderCode, isPaidSuccess, executeRenewalActivation]);

  // Cập nhật paymentExpiresAt khi checkoutData được khởi tạo
  useEffect(() => {
    if (currentStep === 3 && checkoutData?.orderCode && !paymentExpiresAt) {
      if (contract?.pendingRenewalExpiresAt) {
        setPaymentExpiresAt(new Date(contract.pendingRenewalExpiresAt));
      } else {
        const hours = holdHours > 0 ? holdHours : 0;
        if (hours > 0) {
          setPaymentExpiresAt(new Date(Date.now() + hours * 60 * 60 * 1000));
        }
      }
    }
  }, [currentStep, checkoutData, contract, paymentExpiresAt, holdHours]);

  // Bộ đếm ngược thời gian thanh toán VNPay (48 giờ)
  useEffect(() => {
    if (currentStep !== 3 || !paymentExpiresAt) return;

    // Khởi tạo ngay lập tức
    const calcRemaining = () => Math.max(0, Math.floor((paymentExpiresAt.getTime() - Date.now()) / 1000));
    setCountdownSeconds(calcRemaining());

    const timer = setInterval(() => {
      setCountdownSeconds(calcRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep, paymentExpiresAt]);

  // Format đếm ngược dạng đồng hồ giờ:phút:giây (hh:mm:ss) thay cho chữ
  const formatCountdown = (secs: number) => {
    const s = Math.max(0, secs);
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const remainingSecs = s % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // --- Hủy lệnh thanh toán: hủy đơn tại cổng rồi reset về Bước 1 ---
  const handleCancelPayment = () => {
    setIsCancelling(true);
    setShowCancelDialog(false);
    resetPaymentOrder();
    onRequestStepReset();
    setIsCancelling(false);
  };

  const resetPaymentOrder = () => {
    setCheckoutData(null);
    setPaymentExpiresAt(null);
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
    // Countdown
    countdownSeconds,
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
