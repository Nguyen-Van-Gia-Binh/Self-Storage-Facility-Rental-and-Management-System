import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi, type CheckoutResponse } from '../api/customerApi';
import {
  getReservationById,
  cancelReservationApi,
} from '@/api/reservation';
import { generateMoveInPass } from '@/api/payment';
import type { MoveInPassData } from '@/types';
import type { Facility, UnitType } from '../types';

interface UseBookingPaymentParams {
  currentStep: 2 | 3;
  holdHours: number;
  facility: Facility;
  unitType: UnitType;
  finalUnitNumber: string;
  customerName: string;
  customerPhone: string;
  customerIdCard: string;
  startDate: string;
  calculation: any;
}

export function useBookingPayment({
  currentStep,
  holdHours,
  facility,
  finalUnitNumber,
  customerName,
  customerPhone,
  customerIdCard,
  startDate,
  calculation,
}: UseBookingPaymentParams) {
  const navigate = useNavigate();

  // 1. Trạng thái thanh toán & checkout
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'EXPIRED'>('PENDING');

  const [createdReservationId, setCreatedReservationId] = useState<number | null>(null);
  const [createdReservationCode, setCreatedReservationCode] = useState<string>('');
  const [reservationHoldExpiresAt, setReservationHoldExpiresAt] = useState<string | null>(null);

  // 2. Trạng thái Modal hủy giữ chỗ (ISS-77)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isCancellingReservation, setIsCancellingReservation] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // 3. Trạng thái đếm lùi giữ chỗ 48h
  const [secondsRemaining, setSecondsRemaining] = useState<number>(holdHours * 3600);
  const [holdExpired, setHoldExpired] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 4. Trạng thái vé vào cổng & điều khoản
  const [showPassModal, setShowPassModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [createdPass, setCreatedPass] = useState<MoveInPassData | null>(null);

  // 5. Đồng hồ đếm ngược 48h
  useEffect(() => {
    if (currentStep !== 3) return;
    const targetExpiresAt = reservationHoldExpiresAt
      ? new Date(reservationHoldExpiresAt).getTime()
      : Date.now() + holdHours * 3600 * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetExpiresAt - now) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        setHoldExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, reservationHoldExpiresAt, holdHours]);

  const formattedCountdown = useMemo(() => {
    const h = Math.floor(secondsRemaining / 3600);
    const m = Math.floor((secondsRemaining % 3600) / 60);
    const s = secondsRemaining % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [secondsRemaining]);

  // 6. Tạo vé vào cổng điện tử Digital Move-In Pass khi thanh toán thành công
  const handleConfirmBookingPayment = useCallback(() => {
    const pass = generateMoveInPass({
      reservationId: createdReservationCode || (createdReservationId ? `RSV-${createdReservationId}` : `RES-${finalUnitNumber}`),
      unitNumber: finalUnitNumber,
      facilityId: facility.id,
      facilityName: facility.name,
      facilityAddress: facility.address,
      facilityPhone: facility.phone,
      customerName,
      customerPhone,
      customerIdentity: customerIdCard,
      startDate,
      checkInWindow: `Giữ chỗ ${holdHours} giờ kể từ lúc đặt cọc`,
      totalPaid: checkoutData?.amount || calculation?.totalDueToday || 0,
    });
    setCreatedPass(pass);
    setShowPassModal(true);
  }, [
    createdReservationId,
    createdReservationCode,
    checkoutData?.amount,
    calculation?.totalDueToday,
    finalUnitNumber,
    facility.id,
    facility.name,
    facility.address,
    facility.phone,
    customerName,
    customerPhone,
    customerIdCard,
    startDate,
    holdHours,
  ]);

  // 7. Polling kiểm tra trạng thái thanh toán tự động (3s/lần)
  useEffect(() => {
    if (currentStep !== 3 || paymentStatus === 'SUCCESS' || !createdReservationId) return;

    const pollInterval = setInterval(async () => {
      try {
        const rsv = await getReservationById(createdReservationId);
        if (rsv.status === 'CONFIRMED' || rsv.status === 'PAID' || rsv.status === 'ACTIVE') {
          clearInterval(pollInterval);
          setPaymentStatus('SUCCESS');
          handleConfirmBookingPayment();

          let counter = 3;
          const redirectTimer = setInterval(() => {
            counter -= 1;
            setRedirectCountdown(counter);
            if (counter <= 0) {
              clearInterval(redirectTimer);
            }
          }, 1000);
        }
      } catch {
        // bỏ qua lỗi polling mạng
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentStep, paymentStatus, createdReservationId, handleConfirmBookingPayment]);

  // 8. Sao chép nội dung chuyển khoản nhanh
  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // 9. Nút kiểm tra trạng thái thanh toán thủ công
  const handleCheckPaymentStatus = async () => {
    if (!createdReservationId) return;
    setIsVerifying(true);
    setPaymentNotice(null);

    try {
      const rsv = await getReservationById(createdReservationId);
      if (rsv.status === 'CONFIRMED' || rsv.status === 'PAID' || rsv.status === 'ACTIVE') {
        setPaymentStatus('SUCCESS');
        handleConfirmBookingPayment();
      } else {
        setPaymentNotice('Hệ thống chưa nhận được khoản chuyển từ ngân hàng. Quý khách vui lòng kiểm tra lại!');
        setTimeout(() => setPaymentNotice(null), 5000);
      }
    } catch {
      setPaymentNotice('Không thể kiểm tra trạng thái lúc này. Vui lòng thử lại sau giây lát!');
    } finally {
      setIsVerifying(false);
    }
  };

  // 10. Giả lập thanh toán tức thì trên môi trường Sandbox
  const handleSimulateTransfer = async () => {
    if (!createdReservationId) return;
    setIsSimulating(true);
    setPaymentNotice(null);

    try {
      if (checkoutData?.orderCode) {
        await customerApi.processSandboxTransfer(checkoutData.orderCode, 'TRANSFER_SUCCESS');
      }
      setPaymentStatus('SUCCESS');
      handleConfirmBookingPayment();

      let counter = 3;
      const redirectTimer = setInterval(() => {
        counter -= 1;
        setRedirectCountdown(counter);
        if (counter <= 0) {
          clearInterval(redirectTimer);
        }
      }, 1000);
    } catch (err: any) {
      setPaymentNotice(err?.message || 'Giả lập thanh toán không thành công. Vui lòng kiểm tra lại!');
    } finally {
      setIsSimulating(false);
    }
  };

  // 11. Hủy giữ chỗ giải phóng ô kho (ISS-77)
  const handleConfirmCancelReservation = async () => {
    if (!createdReservationId) return;
    setIsCancellingReservation(true);
    setCancelError(null);
    try {
      await cancelReservationApi(createdReservationId);
      localStorage.removeItem('smartstorage_pending_reservation');
      localStorage.removeItem('smartstorage_pending_booking');
      setShowCancelModal(false);
      navigate(`/customer/units?facility=${facility.id || ''}`);
    } catch (err: any) {
      console.error('Lỗi khi hủy giữ chỗ:', err);
      setCancelError(err?.message || 'Không thể hủy đơn đặt chỗ lúc này. Vui lòng thử lại sau!');
    } finally {
      setIsCancellingReservation(false);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    isVerifying,
    isSimulating,
    paymentNotice,
    bookingError,
    setBookingError,
    checkoutData,
    setCheckoutData,
    paymentStatus,
    setPaymentStatus,
    createdReservationId,
    setCreatedReservationId,
    createdReservationCode,
    setCreatedReservationCode,
    reservationHoldExpiresAt,
    setReservationHoldExpiresAt,
    showCancelModal,
    setShowCancelModal,
    isCancellingReservation,
    cancelError,
    holdExpired,
    formattedCountdown,
    redirectCountdown,
    copiedField,
    handleCopyText,
    handleCheckPaymentStatus,
    handleSimulateTransfer,
    handleConfirmCancelReservation,
    showPassModal,
    setShowPassModal,
    showTermsModal,
    setShowTermsModal,
    createdPass,
  };
}
