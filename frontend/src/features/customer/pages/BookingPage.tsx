import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  CheckCircle2, 
  User, 
  Clock, 
  Copy, 
  ArrowRight, 
  AlertTriangle, 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  XCircle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { formatVND } from '../utils/pricing';
import { DigitalMoveInPassModal } from '../components/DigitalMoveInPassModal';
import { TermsOfServiceModal } from '../components/TermsOfServiceModal';
import { generateMoveInPass } from '@/api/payment';
import { customerApi } from '../api/customerApi';
import type { CheckoutResponse } from '../api/customerApi';
import {
  calculateBookingPrice,
  createReservation,
  cancelReservationApi,
  checkUnitAvailability,
  getReservationById,
  type AvailabilityResponse,
  type CalculatePriceResponse,
} from '@/api/reservation';
import type { MoveInPassData } from '@/types';
import { fetchFacilities } from '@/api/facility';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { tokenStorage } from '@/utils/tokenStorage';
import type { FacilityListItem } from '@/types';
import type { Facility, UnitType, StorageType, UnitSizeCategory } from '../types';

function resolveSizeCategory(codeOrName: string, areaM2?: number): UnitSizeCategory {
  const upper = codeOrName.toUpperCase();
  const lower = codeOrName.toLowerCase();
  if (upper.includes('SMALL') || lower.includes('nhỏ') || (areaM2 != null && areaM2 <= 1.5)) {
    return 'S';
  }
  if (upper.includes('LARGE') || lower.includes('lớn') || (areaM2 != null && areaM2 >= 9)) {
    return 'L';
  }
  if (upper.includes('XL') || (areaM2 != null && areaM2 >= 15)) {
    return 'XL';
  }
  return 'M';
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export const BookingPage: React.FC = () => {
  const policy = useActivePolicy();
  const holdHours = policy?.reservationHoldHours ?? 48;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityId = searchParams.get('facility') || searchParams.get('facilityId') || '1';
  const typeId = searchParams.get('type') || searchParams.get('typeId') || '1';
  const unitNumberParam = searchParams.get('unitNumber');
  const unitIdParam = searchParams.get('unit') || searchParams.get('unitId');

  const [facility, setFacility] = useState<Facility>({
    id: facilityId,
    code: '',
    name: 'Cơ sở lưu trữ',
    address: '',
    district: '',
    city: '',
    distance: '',
    startingPrice: 0,
    image: '',
    phone: '',
  });

  const [unitType, setUnitType] = useState<UnitType>({
    id: typeId,
    code: `UT-${typeId}`,
    name: 'Loại ô kho',
    sizeCategory: 'S',
    storageType: 'STANDARD',
    areaM2: 3,
    volumeM3: 7.5,
    dimensions: '1.5m x 2.0m x 2.5m',
    capacityDescription: 'Hệ thống an ninh và PCCC chuẩn quốc tế',
    baseMonthlyPrice: 0,
  });

  const [unavailableModal, setUnavailableModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'NAVIGATE_HOME' | 'NAVIGATE_UNITS';
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'NAVIGATE_HOME',
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const facList = await fetchFacilities();
        if (!isMounted) return;
        const matched = facList.find(
          (f: FacilityListItem) => String(f.id) === facilityId || f.code === facilityId
        );

        if (!matched) {
          setUnavailableModal({
            isOpen: true,
            title: 'Cơ sở lưu trữ tạm ngừng hoạt động',
            message: 'Cơ sở lưu trữ bạn đang chọn hiện đã tạm dừng phục vụ hoặc không tồn tại trên hệ thống.',
            actionType: 'NAVIGATE_HOME',
          });
          return;
        }

        setFacility({
          id: String(matched.id),
          code: matched.code || `FAC-${matched.id}`,
          name: matched.name,
          address: matched.address || '',
          district: '',
          city: '',
          distance: '',
          startingPrice: matched.lowestMonthlyPrice && matched.lowestMonthlyPrice > 0 ? matched.lowestMonthlyPrice : 0,
          image: '',
          phone: matched.phone || '1900 6868',
        });

        const numericId = typeof matched.id === 'number' ? matched.id : Number(matched.id);
        const [utPage, suPage] = await Promise.all([
          fetchUnitTypesApi(numericId, { size: 50 }),
          fetchStorageUnitsApi(numericId, { size: 100 }),
        ]);
        if (!isMounted) return;

        let matchedUnit: any = undefined;
        if (unitIdParam || unitNumberParam) {
          if (suPage?.content) {
            matchedUnit = suPage.content.find(
              (su) => String(su.id) === unitIdParam || su.code === unitNumberParam
            );
          }
        }

        const effectiveTypeId = matchedUnit?.unitTypeId ? String(matchedUnit.unitTypeId) : typeId;

        if (utPage?.content && utPage.content.length > 0) {
          const foundUT = utPage.content.find(
            (ut) => String(ut.id) === effectiveTypeId || ut.code === effectiveTypeId
          ) || utPage.content.find(
            (ut) => String(ut.id) === typeId || ut.code === typeId
          ) || utPage.content[0];

          if (!foundUT) {
            setUnavailableModal({
              isOpen: true,
              title: 'Loại ô kho không khả dụng',
              message: 'Loại ô kho bạn đang chọn hiện không còn khả dụng tại cơ sở này.',
              actionType: 'NAVIGATE_UNITS',
            });
            return;
          }

          const codeUpper = (foundUT.code || foundUT.name).toUpperCase();
          const sizeCat = resolveSizeCategory(foundUT.code || foundUT.name, foundUT.areaM2);
          const isClimate = codeUpper.includes('CLIMATE') || foundUT.name.toLowerCase().includes('lạnh');
          const sType: StorageType = isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD';
          const width = foundUT.widthM || 2;
          const depth = foundUT.depthM || 2;
          const height = foundUT.heightM || 2.5;
          const area = foundUT.areaM2 || Number((width * depth).toFixed(1));
          const vol = foundUT.volumeM3 || Number((width * depth * height).toFixed(1));

          setUnitType({
            id: String(foundUT.id),
            code: foundUT.code || `UT-${foundUT.id}`,
            name: foundUT.name,
            sizeCategory: sizeCat,
            storageType: sType,
            areaM2: area,
            volumeM3: vol,
            dimensions: `${width}m x ${depth}m x ${height}m`,
            capacityDescription: foundUT.description || `${foundUT.name} - An ninh và PCCC chuẩn quốc tế`,
            baseMonthlyPrice: foundUT.monthlyPrice && foundUT.monthlyPrice > 0 ? foundUT.monthlyPrice : 0,
          });
        }

        if (matchedUnit?.code) {
          setSelectedStorageUnitCode(matchedUnit.code);
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin cơ sở & loại kho cho trang Booking:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [facilityId, typeId, unitIdParam, unitNumberParam]);

  const [selectedStorageUnitCode, setSelectedStorageUnitCode] = useState<string>(unitNumberParam || '');
  const finalUnitNumber = selectedStorageUnitCode || unitNumberParam || unitType.name || 'Ô kho đã chọn';
  const finalUnitId = unitIdParam || undefined;

  // Form State
  const monthsParam = parseInt(searchParams.get('months') || '', 10);
  const startDateParam = searchParams.get('startDate');

  const [durationMonths, setDurationMonths] = useState<number>(
    !isNaN(monthsParam) && monthsParam > 0 ? monthsParam : 3
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [startDate, setStartDate] = useState<string>(() => {
    if (startDateParam && startDateParam >= todayStr) {
      return startDateParam;
    }
    return todayStr;
  });

  // Auth Guard: Tự động chuyển hướng Login nếu token hết hạn / chưa đăng nhập
  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      const currentUrl = `/customer/booking${window.location.search}`;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [navigate]);

  const currentUser = tokenStorage.getUser();
  const [customerName, setCustomerName] = useState(() => currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(() => (currentUser as any)?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(() => currentUser?.email || '');
  const [customerIdCard, setCustomerIdCard] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Validation Errors
  const [formErrors, setFormErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerIdCard?: string;
    agreeTerms?: string;
  }>({});

  // Stepper & Success State
  const [currentStep, setCurrentStep] = useState<2 | 3>(2);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [createdPass, setCreatedPass] = useState<MoveInPassData | null>(null);

  const reservationIdParam = searchParams.get('reservationId') || searchParams.get('rsvId');

  // Payment States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [createdReservationId, setCreatedReservationId] = useState<number | null>(null);
  const [createdReservationCode, setCreatedReservationCode] = useState<string>('');

  // Cancel Reservation States
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [isCancellingReservation, setIsCancellingReservation] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Calculate End Date
  const endDate = useMemo(() => {
    if (!startDate) return '';
    const [y, m, d] = startDate.split('-').map(Number);
    const date = new Date(y, m - 1 + durationMonths, d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [startDate, durationMonths]);

  // Nạp đơn giữ chỗ 48h nếu có reservationId trên URL
  useEffect(() => {
    if (!reservationIdParam) return;
    let isMounted = true;
    async function loadExistingReservation() {
      try {
        const rsv = await getReservationById(reservationIdParam!);
        if (!isMounted) return;

        if (rsv.status === 'CANCELLED' || rsv.status === 'EXPIRED') {
          setUnavailableModal({
            isOpen: true,
            title: 'Đơn giữ chỗ đã hết hạn hoặc bị hủy',
            message: 'Đơn giữ chỗ này đã hết thời gian hiệu lực 48h hoặc đã được hủy. Quý khách vui lòng chọn lại ô kho mới.',
            actionType: 'NAVIGATE_UNITS',
          });
          return;
        }

        if (rsv.status === 'ACTIVE' || rsv.status === 'CONFIRMED' || rsv.status === 'PAID') {
          navigate('/customer/my-units', { replace: true });
          return;
        }

        setCreatedReservationId(rsv.id);
        setCreatedReservationCode(rsv.code || `RSV-${rsv.id}`);
        setReservationHoldExpiresAt(rsv.holdExpiresAt);
        if (rsv.startDate) setStartDate(rsv.startDate);
        if (rsv.rentalMonths) setDurationMonths(rsv.rentalMonths);

        const checkout = await customerApi.createPaymentCheckout({
          referenceType: 'RESERVATION',
          referenceId: rsv.id,
          description: `DH${rsv.id}`,
        });

        if (!isMounted) return;
        setCheckoutData(checkout);
        setPaymentStatus('PENDING');
        setCurrentStep(3);
      } catch (err) {
        console.error('Lỗi khi nạp đơn giữ chỗ có sẵn:', err);
      }
    }
    loadExistingReservation();
    return () => { isMounted = false; };
  }, [reservationIdParam, navigate]);

  // Backend Pricing
  const [backendPricing, setBackendPricing] = useState<CalculatePriceResponse | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadPrice() {
      const fId = Number(facilityId);
      const uId = Number(typeId);
      if (!Number.isFinite(fId) || fId <= 0 || !Number.isFinite(uId) || uId <= 0 || durationMonths <= 0) {
        if (isMounted) setBackendPricing(null);
        return;
      }
      try {
        const res = await calculateBookingPrice({
          facilityId: fId,
          unitTypeId: uId,
          months: durationMonths,
        });
        if (isMounted) {
          setBackendPricing(res);
        }
      } catch (err) {
        console.warn('Lỗi gọi API tính giá backend:', err);
      }
    }
    loadPrice();
    return () => { isMounted = false; };
  }, [facilityId, typeId, durationMonths]);

  useEffect(() => {
    if (reservationIdParam) return;
    let isMounted = true;
    async function loadAvailability() {
      const fId = Number(facilityId);
      const uId = Number(typeId);
      if (!Number.isFinite(fId) || fId <= 0 || !Number.isFinite(uId) || uId <= 0) return;
      setIsCheckingAvailability(true);
      try {
        const res = await checkUnitAvailability(fId, uId, startDate, durationMonths);
        if (isMounted) setAvailability(res);
      } catch {
        if (isMounted) setAvailability(null);
      } finally {
        if (isMounted) setIsCheckingAvailability(false);
      }
    }
    loadAvailability();
    return () => { isMounted = false; };
  }, [reservationIdParam, facilityId, typeId, startDate, durationMonths]);

  // Tính toán bảng giá
  const calculation = useMemo(() => {
    const baseMonthlyPrice = unitType.baseMonthlyPrice || 0;
    if (backendPricing) {
      return {
        unitPrice: backendPricing.monthlyPrice || baseMonthlyPrice,
        rentalFee: backendPricing.rawRentTotal || baseMonthlyPrice * durationMonths,
        discountAmount: backendPricing.discountAmount || 0,
        discountPercent: backendPricing.discountPercentage || (durationMonths >= 12 ? 10 : durationMonths >= 6 ? 5 : 0),
        depositAmount: backendPricing.depositAmount || baseMonthlyPrice,
        totalDueToday: backendPricing.totalDueToday || (baseMonthlyPrice * durationMonths + baseMonthlyPrice),
      };
    }

    const grossRent = baseMonthlyPrice * durationMonths;
    let discountPercent = 0;
    if (durationMonths >= 12) discountPercent = 10;
    else if (durationMonths >= 6) discountPercent = 5;

    const discountAmount = Math.round((grossRent * discountPercent) / 100);
    const netRent = grossRent - discountAmount;
    const depositAmount = baseMonthlyPrice;
    const totalDueToday = netRent + depositAmount;

    return {
      unitPrice: baseMonthlyPrice,
      rentalFee: grossRent,
      discountAmount,
      discountPercent,
      depositAmount,
      totalDueToday,
    };
  }, [backendPricing, unitType.baseMonthlyPrice, durationMonths]);

  // Tạo MoveInPass khi đã thanh toán thành công
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

  // Polling đối soát thanh toán
  const handleCheckPaymentStatus = async () => {
    if (!checkoutData?.orderCode) return;
    setIsVerifying(true);
    setPaymentNotice(null);
    try {
      const res = await customerApi.getPaymentStatus(checkoutData.orderCode);
      if (res && res.status === 'SUCCESS') {
        setPaymentStatus('SUCCESS');
        handleConfirmBookingPayment();
      } else {
        setPaymentNotice('Hệ thống chưa ghi nhận thanh toán. Vui lòng quét mã hoặc bấm nút xác nhận chuyển khoản!');
      }
    } catch {
      setPaymentNotice('Lỗi kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.');
    } finally {
      setIsVerifying(false);
    }
  };

  const [reservationHoldExpiresAt, setReservationHoldExpiresAt] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [holdClockReady, setHoldClockReady] = useState(false);
  const fallbackHoldStarted = useRef(false);

  useEffect(() => {
    if (currentStep !== 3) return;
    const tick = () => {
      if (reservationHoldExpiresAt) {
        const left = Math.floor((new Date(reservationHoldExpiresAt).getTime() - Date.now()) / 1000);
        setSecondsLeft(Math.max(0, left));
        setHoldClockReady(true);
        return;
      }
      if (holdHours <= 0) return;
      setSecondsLeft((prev) => {
        if (!fallbackHoldStarted.current) {
          fallbackHoldStarted.current = true;
          return holdHours * 3600;
        }
        return prev > 0 ? prev - 1 : 0;
      });
      setHoldClockReady(true);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [currentStep, reservationHoldExpiresAt, holdHours]);

  const holdExpired = currentStep === 3 && paymentStatus !== 'SUCCESS' && holdClockReady && secondsLeft === 0;
  const hasPaymentSession = checkoutData != null;
  const previousHoldElapsed = hasPaymentSession && paymentStatus !== 'SUCCESS' && holdClockReady && secondsLeft === 0;

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  // Hủy giữ chỗ
  const handleConfirmCancelReservation = async () => {
    setIsCancellingReservation(true);
    setCancelError(null);
    try {
      if (createdReservationId) {
        await cancelReservationApi(createdReservationId, 'Khách hàng chủ động hủy giữ chỗ');
      }
      try {
        localStorage.removeItem('smartstorage_pending_booking');
      } catch {
        // Bỏ qua
      }
      setShowCancelModal(false);
      navigate(`/customer/units?facility=${facility.id}`, { replace: true });
    } catch (err: any) {
      setCancelError(err?.message || 'Không thể hủy đơn đặt chỗ. Vui lòng thử lại.');
    } finally {
      setIsCancellingReservation(false);
    }
  };

  // Giả lập chuyển tiền Sandbox trực tiếp
  const handleSimulateTransfer = async () => {
    if (!checkoutData?.orderCode || holdExpired) return;
    setIsSimulating(true);
    setPaymentNotice(null);
    try {
      await customerApi.processSandboxTransfer(checkoutData.orderCode, 'TRANSFER_SUCCESS');
      setPaymentStatus('SUCCESS');
      handleConfirmBookingPayment();
    } catch (err: any) {
      setPaymentNotice(err?.message || 'Không thể xác nhận chuyển tiền Sandbox. Vui lòng thử lại!');
    } finally {
      setIsSimulating(false);
    }
  };

  // Tự động chuyển tới My Units sau thanh toán thành công
  useEffect(() => {
    if (paymentStatus !== 'SUCCESS') return;
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/customer/my-units');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentStatus, navigate]);

  // Polling tự động lắng nghe Webhook
  useEffect(() => {
    if (currentStep !== 3 || !checkoutData?.orderCode || paymentStatus === 'SUCCESS') return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await customerApi.getPaymentStatus(checkoutData.orderCode);
        if (res && res.status === 'SUCCESS') {
          setPaymentStatus('SUCCESS');
          clearInterval(pollInterval);
          handleConfirmBookingPayment();
        }
      } catch {
        // Polling retry
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [currentStep, checkoutData?.orderCode, paymentStatus, handleConfirmBookingPayment]);

  const formattedCountdown = useMemo(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [secondsLeft]);

  const validateForm = (): boolean => {
    const errors: {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerIdCard?: string;
      agreeTerms?: string;
    } = {};

    if (!customerName.trim()) {
      errors.customerName = 'Vui lòng nhập họ và tên đầy đủ.';
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      errors.customerPhone = 'Số điện thoại không hợp lệ (10 số).';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      errors.customerEmail = 'Định dạng email không hợp lệ.';
    }

    const cleanId = customerIdCard.replace(/\s+/g, '');
    if (cleanId.length < 9 || cleanId.length > 12 || !/^\d+$/.test(cleanId)) {
      errors.customerIdCard = 'Số CCCD / Hộ chiếu phải gồm 9 đến 12 chữ số.';
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'Bạn cần đồng ý với điều khoản dịch vụ để tiếp tục.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenStorage.getAccessToken() || !tokenStorage.getUser()) {
      const currentUrl = `/customer/booking${window.location.search}`;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      let numericFacilityId = 1;
      if (typeof facility.id === 'number') {
        numericFacilityId = facility.id;
      } else if (typeof facility.id === 'string') {
        const match = facility.id.match(/\d+/);
        numericFacilityId = match ? parseInt(match[0], 10) : 1;
      }

      let numericUnitTypeId = 1;
      if (typeof unitType.id === 'number') {
        numericUnitTypeId = unitType.id;
      } else if (typeof unitType.id === 'string') {
        const match = unitType.id.match(/\d+/);
        numericUnitTypeId = match ? parseInt(match[0], 10) : 1;
      }

      let numericUnitId: number | undefined = undefined;
      if (finalUnitId) {
        const match = String(finalUnitId).match(/\d+/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (!isNaN(parsed) && parsed > 0) {
            numericUnitId = parsed;
          }
        }
      }

      const rsv = await createReservation({
        facilityId: numericFacilityId,
        unitTypeId: numericUnitTypeId,
        storageUnitId: numericUnitId,
        startDate,
        rentalMonths: durationMonths,
        customerName,
        customerPhone: customerPhone.replace(/\s+/g, ''),
        customerEmail: customerEmail.trim(),
        identityNumber: customerIdCard.replace(/\s+/g, ''),
      });

      const rsvId = rsv.id || 1;
      setCreatedReservationId(rsvId);
      setCreatedReservationCode(rsv.code || (rsv.id ? `RSV-${rsv.id}` : `RSV-${finalUnitNumber}`));
      const nextHoldExpiresAt = rsv.holdExpiresAt || new Date(Date.now() + holdHours * 3600 * 1000).toISOString();
      setReservationHoldExpiresAt(nextHoldExpiresAt);

      const checkout = await customerApi.createPaymentCheckout({
        referenceType: 'RESERVATION',
        referenceId: rsvId,
        description: `DH${rsvId}`,
      });

      setCheckoutData(checkout);
      setPaymentStatus('PENDING');
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Lỗi khi khởi tạo đơn đặt chỗ hoặc PayOS:', err);
      setBookingError(err?.message || 'Không thể tạo đơn đặt chỗ. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* TOP BAR / STEPPER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-200/60">
        <div>
          <Link
            to={facility.id ? `/customer/units?facility=${facility.id}&type=${unitType.id}` : '/customer'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại chọn kho</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a1614] tracking-tight">
            {currentStep === 2 ? 'Thông Tin Đặt Chỗ' : 'Thanh Toán VietQR'}
          </h1>
        </div>

        {/* STEPPER */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400">1. Chọn kho</span>
          <span className="text-slate-300">→</span>
          <span className={`px-3 py-1 rounded-full ${currentStep === 2 ? 'bg-brand-100 text-[#0a1614] font-bold border border-brand-300' : 'text-slate-500'}`}>
            2. Thông tin khách hàng
          </span>
          <span className="text-slate-300">→</span>
          <span className={`px-3 py-1 rounded-full ${currentStep === 3 ? 'bg-brand-100 text-[#0a1614] font-bold border border-brand-300' : 'text-slate-400'}`}>
            3. Thanh toán VietQR (48h)
          </span>
        </div>
      </div>

      {currentStep === 2 ? (
        /* ==================== STEP 2: FORM THÔNG TIN KHÁCH HÀNG ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: FORM (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              
              {/* 1. THÔNG TIN KHÁCH HÀNG */}
              <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-brand-100">
                  <User className="w-4 h-4 text-brand-600" />
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614]">
                    1. Thông tin người thuê ô kho
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Họ và tên <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
                    />
                    {formErrors.customerName && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerName}</p>
                    )}
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Số điện thoại liên hệ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
                    />
                    {formErrors.customerPhone && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerPhone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Email nhận mã PIN & Hợp đồng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
                    />
                    {formErrors.customerEmail && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerEmail}</p>
                    )}
                  </div>

                  {/* Số CCCD / Hộ chiếu (BẮT BUỘC THEO QUY ĐỊNH NHẬN KHO) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Số CCCD / Hộ chiếu (12 số) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      value={customerIdCard}
                      onChange={(e) => setCustomerIdCard(e.target.value)}
                      placeholder="Nhập 12 số CCCD..."
                      className="w-full px-3.5 py-2.5 bg-white border border-brand-200 rounded-xl text-xs sm:text-sm font-semibold text-[#0a1614] focus:outline-none focus:border-brand-500 shadow-xs"
                    />
                    <p className="text-[10px] text-slate-500">Dùng đối chiếu khi nhận bàn giao kho tại cơ sở</p>
                    {formErrors.customerIdCard && (
                      <p className="text-[11px] text-rose-600 font-semibold">{formErrors.customerIdCard}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. ĐIỀU KHOẢN DỊCH VỤ & CHÍNH SÁCH */}
              <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-xs space-y-3">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614] pb-2 border-b border-brand-100">
                  2. Điều khoản dịch vụ & Chính sách lưu trữ
                </h2>

                <div className="p-4 bg-brand-50/50 border border-brand-200/70 rounded-xl space-y-2 text-xs text-slate-600">
                  <p>• <strong>Nhận bàn giao kho:</strong> Quý khách xuất trình CCCD trùng khớp khi đến cơ sở để nhận mã PIN điện tử (hoặc mã QR) và hướng dẫn mở kho.</p>
                  <p>• <strong>Chính sách giữ chỗ:</strong> Đơn đặt cọc giữ chỗ có hiệu lực trong 48 giờ. Hủy trước ngày bắt đầu được hoàn 100% tiền thuê.</p>
                  <p>• <strong>Hoàn trả tiền cọc:</strong> Tiền cọc giữ kho (1 tháng) được hoàn trả 100% ngay khi thanh lý hợp đồng đúng hạn.</p>
                </div>

                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-[#0a1614]">
                    Tôi đã đọc, hiểu rõ và đồng ý với Điều khoản sử dụng và Chính sách cọc của SmartStorage.
                  </span>
                </label>
                {formErrors.agreeTerms && (
                  <p className="text-[11px] text-rose-600 font-semibold">{formErrors.agreeTerms}</p>
                )}
              </div>

              {bookingError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                  {bookingError}
                </div>
              )}

              {/* NÚT SUBMIT */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || isCheckingAvailability || (availability !== null && availability.availableSlots <= 0 && !previousHoldElapsed)}
                  className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-[1.01] flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo mã thanh toán VietQR...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục: Thanh toán VietQR & Giữ chỗ 48h</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

            </form>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN ĐẶT CHỖ (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614] pb-2 border-b border-brand-100">
                Tóm tắt đơn đặt chỗ
              </h2>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Cơ sở:</span>
                  <strong className="text-[#0a1614] text-right">{facility.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Ô kho đã chọn:</span>
                  <strong className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                    {finalUnitNumber}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Loại kho:</span>
                  <strong className="text-[#0a1614]">{unitType.name} ({unitType.areaM2} m²)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian thuê:</span>
                  <strong className="text-[#0a1614]">{formatDateVN(startDate)} → {formatDateVN(endDate)} ({durationMonths} tháng)</strong>
                </div>
              </div>

              <div className="border-t border-brand-100 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Đơn giá niêm yết:</span>
                  <span>{formatVND(calculation.unitPrice)}/tháng</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền thuê {durationMonths} tháng:</span>
                  <span className="font-semibold text-[#0a1614]">{formatVND(calculation.rentalFee)}</span>
                </div>
                {calculation.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Chiết khấu ({calculation.discountPercent}%):</span>
                    <span>-{formatVND(calculation.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tiền cọc giữ kho (1 tháng):</span>
                  <span className="font-semibold text-[#0a1614]">{formatVND(calculation.depositAmount)}</span>
                </div>
              </div>

              <div className="bg-brand-50/80 border border-brand-200 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0a1614]">Tổng thanh toán ban đầu:</span>
                  <span className="text-lg font-black text-brand-700 font-mono">
                    {formatVND(calculation.totalDueToday)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Tiền cọc được hoàn trả 100% khi thanh lý hợp đồng.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ==================== STEP 3: THANH TOÁN VIETQR & GIỮ CHỖ 48H ==================== */
        <div className="space-y-6">
          
          {/* TOP BANNER */}
          <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    Đã tạo đơn thành công
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    Mã đơn: <strong className="text-[#0a1614]">{checkoutData?.description || `DH${createdReservationId}`}</strong>
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0a1614] mt-0.5">
                  Quét Mã VietQR Chuyển Khoản Nhanh 24/7
                </h2>
              </div>
            </div>

            {/* COUNTDOWN */}
            <div className="flex items-center gap-3 bg-brand-50/80 border border-brand-200/90 px-4 py-2.5 rounded-xl shrink-0">
              <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Thời gian giữ chỗ còn lại</div>
                <div className="text-base font-black text-brand-700 font-mono tracking-tight">{formattedCountdown}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* CỘT TRÁI: THANH TOÁN (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              
              <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* WEBHOOK STATUS */}
                <div className="flex items-center justify-between gap-3 bg-brand-50/70 border border-brand-200/80 px-4 py-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5 text-[#0a1614] font-semibold">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                    </span>
                    <span>Hệ thống đang tự động lắng nghe Webhook... (Tự động cấp mã mở kho ngay khi chuyển tiền xong)</span>
                  </div>
                  {checkoutData?.checkoutUrl && (
                    <a
                      href={checkoutData.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700 font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở tab mới</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* QR & BANK DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* QR */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 border border-brand-200/80 rounded-2xl">
                    <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                      {checkoutData?.qrCode ? (
                        <QRCodeSVG value={checkoutData.qrCode} size={165} level="M" includeMargin={true} />
                      ) : (
                        <img
                          src={`https://img.vietqr.io/image/970422-0888567999-compact2.png?amount=${checkoutData?.amount || calculation?.totalDueToday || 0}&addInfo=${encodeURIComponent(checkoutData?.description || `DH${createdReservationId}`)}&accountName=${encodeURIComponent(checkoutData?.accountName || 'SMARTSTORAGE')}`}
                          alt="VietQR Code"
                          className="w-40 h-40 object-contain"
                        />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a1614] bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        VietQR • MB Bank (Napas 247)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1.5">Quét bằng Camera / Zalo / App Ngân hàng</p>
                    </div>
                  </div>

                  {/* THÔNG TIN TÀI KHOẢN */}
                  <div className="md:col-span-7 space-y-3">
                    
                    <div className="bg-slate-50/80 border border-brand-200/60 p-3 rounded-xl">
                      <div className="text-[11px] font-semibold text-slate-500">Ngân hàng thụ hưởng</div>
                      <div className="text-xs font-bold text-[#0a1614] mt-0.5">MB Bank (Ngân hàng Quân Đội)</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Chủ tài khoản: <strong className="text-[#0a1614] uppercase">{checkoutData?.accountName || 'CONG TY CP SMARTSTORAGE VIETNAM'}</strong>
                      </div>
                    </div>

                    {/* SỐ TÀI KHOẢN */}
                    <div className="flex items-center justify-between bg-white border border-brand-200 p-3 rounded-xl shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Số tài khoản định danh</div>
                        <div className="text-base font-black text-[#0a1614] font-mono mt-0.5">
                          {checkoutData?.accountNumber || '0888567999'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(checkoutData?.accountNumber || '0888567999', 'stk')}
                        className="px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>

                    {/* SỐ TIỀN */}
                    <div className="flex items-center justify-between bg-white border border-brand-200 p-3 rounded-xl shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Số tiền cần chuyển</div>
                        <div className="text-lg font-black text-brand-700 font-mono mt-0.5">
                          {formatVND(checkoutData?.amount || calculation?.totalDueToday || 0)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(String(checkoutData?.amount || calculation?.totalDueToday || 0), 'amount')}
                        className="px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>

                    {/* NỘI DUNG CHUYỂN KHOẢN */}
                    <div className="flex items-center justify-between bg-amber-50/70 border border-amber-300 p-3 rounded-xl shadow-xs">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                          <span>Nội dung chuyển khoản (Bắt buộc)</span>
                          <span className="text-rose-600">*</span>
                        </div>
                        <div className="text-base font-black text-amber-950 font-mono mt-0.5">
                          {checkoutData?.description || `DH${createdReservationId}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(checkoutData?.description || `DH${createdReservationId}`, 'desc')}
                        className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedField === 'desc' ? '✓ Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>

                  </div>

                </div>

                <div className="pt-4 border-t border-brand-100 flex items-start gap-2.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <p><strong>Bảo mật truy cập:</strong> Thẻ nhận kho và mã PIN mở cửa chỉ được cấp ngay sau khi hệ thống ghi nhận thanh toán thành công.</p>
                </div>

              </div>

              {/* PAYMENT NOTICE ERROR / INFO */}
              {paymentNotice && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{paymentNotice}</span>
                </div>
              )}

              {/* SUCCESS NOTICE */}
              {paymentStatus === 'SUCCESS' && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold">Thanh toán đã được ghi nhận thành công!</div>
                      <div className="text-[11px] text-emerald-700">Đang tạo mã PIN và chuyển về Quản lý kho...</div>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-emerald-200/70 text-emerald-900 font-mono font-bold rounded-lg text-xs">
                    {redirectCountdown}s
                  </div>
                </div>
              )}

              {/* SANDBOX TEST BAR */}
              <div className="bg-amber-50/50 border border-dashed border-amber-300 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🧪</span>
                    <div>
                      <div className="text-xs font-bold text-amber-900">Môi trường Thử nghiệm (Sandbox Payment)</div>
                      <div className="text-[11px] text-amber-800/80">Dùng để test demo chuyển khoản nhanh không cần tiền thật</div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSimulateTransfer}
                    disabled={isSimulating || paymentStatus === 'SUCCESS' || holdExpired}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang xử lý Sandbox...</span>
                      </>
                    ) : (
                      <span>⚡ Giả Lập Chuyển Khoản Thành Công</span>
                    )}
                  </button>
                </div>
              </div>

              {/* BOTTOM ACTION BUTTONS */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                >
                  ✕ Hủy đơn đặt chỗ
                </button>

                <button
                  type="button"
                  onClick={handleCheckPaymentStatus}
                  disabled={isVerifying || paymentStatus === 'SUCCESS'}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : paymentStatus === 'SUCCESS' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Thành công ({redirectCountdown}s)</span>
                    </>
                  ) : (
                    <>
                      <span>Tôi đã chuyển khoản / Lấy vé nhận kho</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* CỘT PHẢI: TÓM TẮT CHI PHÍ (4 cols) */}
            <div className="lg:col-span-4">
              <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-sm sticky top-24 space-y-4">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#0a1614] pb-2 border-b border-brand-100">
                  Tóm tắt chi phí thuê
                </h2>

                <div className="space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Cơ sở:</span>
                    <strong className="text-[#0a1614] text-right">{facility.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ô kho:</span>
                    <strong className="font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {finalUnitNumber}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Loại kho:</span>
                    <strong className="text-[#0a1614]">{unitType.name} ({unitType.areaM2} m²)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời hạn thuê:</span>
                    <strong className="text-[#0a1614]">{durationMonths} tháng</strong>
                  </div>
                </div>

                <div className="border-t border-brand-100 pt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Tiền thuê {durationMonths} tháng:</span>
                    <span className="font-semibold text-[#0a1614]">{formatVND(calculation.rentalFee)}</span>
                  </div>
                  {calculation.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Chiết khấu ({calculation.discountPercent}%):</span>
                      <span>-{formatVND(calculation.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tiền cọc giữ kho (1 tháng):</span>
                    <span className="font-semibold text-[#0a1614]">{formatVND(calculation.depositAmount)}</span>
                  </div>
                </div>

                <div className="bg-brand-50/80 border border-brand-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0a1614]">Tổng thanh toán:</span>
                    <span className="text-base font-black text-brand-700 font-mono">
                      {formatVND(checkoutData?.amount || calculation.totalDueToday)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Modal hủy đặt chỗ */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)}>
        <div className="p-6 max-w-md w-full space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận hủy đơn đặt chỗ?</h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Nếu hủy đơn, ô kho đang giữ chỗ sẽ được giải phóng cho khách hàng khác trên hệ thống.
            </p>
          </div>
          {cancelError && (
            <p className="text-xs text-rose-600 font-semibold">{cancelError}</p>
          )}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 justify-center py-2.5 text-xs font-bold"
              onClick={() => setShowCancelModal(false)}
            >
              Giữ lại đơn
            </Button>
            <Button
              variant="primary"
              className="flex-1 justify-center py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmCancelReservation}
              disabled={isCancellingReservation}
            >
              {isCancellingReservation ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Digital Move-in Pass Modal */}
      {showPassModal && createdPass && (
        <DigitalMoveInPassModal
          isOpen={showPassModal}
          onClose={() => setShowPassModal(false)}
          passData={createdPass}
        />
      )}

      {/* Terms Modal */}
      <TermsOfServiceModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Modal cảnh báo ô kho / cơ sở */}
      <Modal
        isOpen={unavailableModal.isOpen}
        onClose={() => {
          setUnavailableModal((prev) => ({ ...prev, isOpen: false }));
          navigate(unavailableModal.actionType === 'NAVIGATE_HOME' ? '/customer' : `/customer/units?facility=${facilityId}`);
        }}
      >
        <div className="p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">{unavailableModal.title}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {unavailableModal.message}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full justify-center py-2.5 text-xs sm:text-sm font-semibold"
              onClick={() => {
                setUnavailableModal((prev) => ({ ...prev, isOpen: false }));
                navigate(unavailableModal.actionType === 'NAVIGATE_HOME' ? '/customer' : `/customer/units?facility=${facilityId}`);
              }}
            >
              Quay lại
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};
