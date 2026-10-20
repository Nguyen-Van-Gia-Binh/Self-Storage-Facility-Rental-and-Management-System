import { useState, useEffect, useMemo, useCallback } from 'react';
import { getCustomerContracts } from '@/api/customerRentals';
import { getMyReservationsApi, cancelReservationApi, type ReservationResponse } from '@/api/reservation';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { parseReminderDays, shouldRemindRenewal } from '../utils/policyTerms';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { tokenStorage } from '@/utils/tokenStorage';
import type { RentedContract } from '../types';

export function useCustomerContracts() {
  const isAuthenticated = Boolean(tokenStorage.getAccessToken());
  const policy = useActivePolicy();
  const noticeDays = policy?.returnNoticeDays ?? 0;
  const reminderDays = useMemo(() => parseReminderDays(policy?.renewalReminderDays), [policy]);

  const [contracts, setContracts] = useState<RentedContract[]>([]);
  const [pendingReservations, setPendingReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Trạng thái hủy đơn giữ chỗ 48h
  const [cancellingReservation, setCancellingReservation] = useState<ReservationResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Trạng thái pop-up nhắc gia hạn sớm
  const [earlyRenewalContract, setEarlyRenewalContract] = useState<RentedContract | null>(null);
  const [showEarlyRenewalModal, setShowEarlyRenewalModal] = useState<boolean>(false);

  // 1. Tải toàn bộ hợp đồng và đơn đặt chỗ của khách hàng
  const loadContracts = useCallback(async () => {
    if (!isAuthenticated) {
      setContracts([]);
      setPendingReservations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [contractsData, reservationsData] = await Promise.all([
        getCustomerContracts(),
        getMyReservationsApi().catch((err) => {
          console.warn('Lỗi tải danh sách reservations:', err);
          return [] as ReservationResponse[];
        }),
      ]);
      setContracts(contractsData);

      // Lọc các đơn đang ở trạng thái PENDING_PAYMENT và chưa hết hạn giữ chỗ
      const activePending = reservationsData.filter((r) => {
        if (r.status !== 'PENDING_PAYMENT') return false;
        if (r.holdExpiresAt && new Date(r.holdExpiresAt).getTime() <= Date.now()) return false;
        return true;
      });
      setPendingReservations(activePending);
    } catch (err) {
      console.error('Lỗi tải danh sách hợp đồng & đơn đặt chỗ:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // 2. Handler hủy đơn giữ chỗ từ trang My Units
  const handleConfirmCancelReservation = async () => {
    if (!cancellingReservation) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelReservationApi(cancellingReservation.id, 'Khách hàng hủy giữ chỗ từ trang Kho của tôi');
      setCancellingReservation(null);
      loadContracts();
    } catch (err: any) {
      console.error('Lỗi hủy đơn giữ chỗ:', err);
      setCancelError(err?.message || 'Không thể hủy đơn đặt chỗ. Vui lòng thử lại.');
    } finally {
      setIsCancelling(false);
    }
  };

  // 3. Handler khi đổi mã PIN thành công
  const handlePinChanged = (contractId: string, newPin: string) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, accessPin: newPin } : c))
    );
  };

  // 4. Handler khi đăng ký trả kho thành công
  const handleReturnScheduled = (contractId: string, returnDate: string) => {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? { ...c, status: 'PENDING_RETURN', scheduledReturnDate: returnDate }
          : c
      )
    );
    loadContracts();
  };

  // 5. Kiểm tra ứng viên cần nhắc gia hạn sớm theo chính sách BOM Policy
  const earlyRenewalCandidate = useMemo(() => {
    if (!policy) return null;
    return (
      contracts.find((c) => {
        if (c.status !== 'ACTIVE') return false;
        return shouldRemindRenewal(calculateDaysRemaining(c.endDate), noticeDays, reminderDays);
      }) || null
    );
  }, [contracts, policy, noticeDays, reminderDays]);

  useEffect(() => {
    if (!earlyRenewalCandidate) return;
    const isDismissed = sessionStorage.getItem(`early_renewal_dismissed_${earlyRenewalCandidate.id}`) === 'true';
    if (!isDismissed) {
      setEarlyRenewalContract(earlyRenewalCandidate);
      setShowEarlyRenewalModal(true);
    }
  }, [earlyRenewalCandidate]);

  const handleCloseEarlyRenewalModal = () => {
    if (earlyRenewalContract) {
      sessionStorage.setItem(`early_renewal_dismissed_${earlyRenewalContract.id}`, 'true');
    }
    setShowEarlyRenewalModal(false);
  };

  // 6. Bộ đếm số lượng hợp đồng độc lập theo từng trạng thái nghiệp vụ
  const activeCount = useMemo(() => contracts.filter((c) => c.status === 'ACTIVE').length, [contracts]);
  const expiringCount = useMemo(
    () =>
      contracts.filter((c) => {
        if (c.status !== 'ACTIVE') return false;
        const days = calculateDaysRemaining(c.endDate);
        const threshold = (noticeDays && noticeDays > 0 ? noticeDays : 30) + 7;
        return days > 0 && days <= threshold;
      }).length,
    [contracts, noticeDays]
  );
  const overdueCount = useMemo(() => contracts.filter((c) => c.status === 'OVERDUE').length, [contracts]);
  const pendingReturnCount = useMemo(
    () => contracts.filter((c) => c.status === 'PENDING_RETURN').length,
    [contracts]
  );
  const pendingCheckinCount = useMemo(
    () =>
      contracts.filter(
        (c) => c.status === 'PENDING_CHECKIN' || (c.status as string) === 'PENDING_CHECK_IN'
      ).length,
    [contracts]
  );
  const closedCount = useMemo(
    () => contracts.filter((c) => c.status === 'CLOSED' || c.status === 'TERMINATED').length,
    [contracts]
  );

  return {
    isAuthenticated,
    noticeDays,
    reminderDays,
    contracts,
    setContracts,
    pendingReservations,
    loading,
    loadContracts,
    cancellingReservation,
    setCancellingReservation,
    isCancelling,
    cancelError,
    handleConfirmCancelReservation,
    handlePinChanged,
    handleReturnScheduled,
    earlyRenewalContract,
    showEarlyRenewalModal,
    handleCloseEarlyRenewalModal,
    activeCount,
    expiringCount,
    overdueCount,
    pendingReturnCount,
    pendingCheckinCount,
    closedCount,
  };
}
