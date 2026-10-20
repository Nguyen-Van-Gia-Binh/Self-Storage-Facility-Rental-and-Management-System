import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { normalizeDiscountPercent } from '../utils/pricing';
import { resolveSizeCategory } from '../utils/unitPickerHelpers';
import { customerApi } from '../api/customerApi';
import {
  calculateBookingPrice,
  createReservation,
  checkUnitAvailability,
  getReservationById,
  getMyReservationsApi,
  type AvailabilityResponse,
  type CalculatePriceResponse,
} from '@/api/reservation';
import { fetchFacilities } from '@/api/facility';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { fetchUnitTypes as fetchUnitTypesApi, fetchStorageUnits as fetchStorageUnitsApi } from '@/api/unit';
import { tokenStorage } from '@/utils/tokenStorage';
import type { FacilityListItem } from '@/types';
import type { Facility, UnitType, StorageType } from '../types';
import { BookingCustomerForm } from '../components/BookingCustomerForm';
import { BookingPaymentStep } from '../components/BookingPaymentStep';
import { BookingSummaryCard } from '../components/BookingSummaryCard';
import { BookingModals } from '../components/BookingModals';
import { useBookingPayment } from '../hooks/useBookingPayment';
import { validateBookingCustomerForm, type BookingFormErrors } from '../utils/bookingValidation';

export const BookingPage: React.FC = () => {
  const policy = useActivePolicy();
  const depositMultiplier = policy?.depositMultiplier ?? 1;
  const depositMultiplierLabel = Number.isInteger(depositMultiplier)
    ? String(depositMultiplier)
    : depositMultiplier.toFixed(1).replace(/\.0$/, '');
  const holdHours = policy?.reservationHoldHours ?? 48;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityId = searchParams.get('facility') || searchParams.get('facilityId') || '1';
  const typeId = searchParams.get('type') || searchParams.get('typeId') || '1';
  const unitNumberParam = searchParams.get('unitNumber');
  const unitIdParam = searchParams.get('unit') || searchParams.get('unitId');
  const reservationIdParam = searchParams.get('reservationId') || searchParams.get('rsvId');

  // 1. Quản lý trạng thái Cơ sở & Loại ô kho
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

  const [pendingLimitModal, setPendingLimitModal] = useState<{
    isOpen: boolean;
    pendingReservation: any | null;
  }>({
    isOpen: false,
    pendingReservation: null,
  });

  const [selectedStorageUnitCode, setSelectedStorageUnitCode] = useState<string>(unitNumberParam || '');
  const finalUnitNumber = selectedStorageUnitCode || unitNumberParam || unitType.name || 'Ô kho đã chọn';
  const finalUnitId = unitIdParam || undefined;

  // 2. Tải dữ liệu cơ sở, ô kho & kiểm tra an ninh (ISS-75, ISS-76, ISS-80)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const facList = await fetchFacilities();
        if (!isMounted) return;
        const matched = facList.find(
          (f: FacilityListItem) => String(f.id) === facilityId || f.code === facilityId
        );

        const isFacilityInactive = !matched || !matched.isActive;
        if (isFacilityInactive) {
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

        const isUnitUnavailable = matchedUnit && matchedUnit.status && matchedUnit.status !== 'AVAILABLE';
        if (isUnitUnavailable) {
          setUnavailableModal({
            isOpen: true,
            title: 'Ô kho không khả dụng',
            message: 'Ô kho bạn đang chọn hiện không còn khả dụng để đặt chỗ.',
            actionType: 'NAVIGATE_UNITS',
          });
          return;
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

          const isUnlisted = !foundUT.monthlyPrice || foundUT.monthlyPrice <= 0 || foundUT.priceStatus === 'UNLISTED' || foundUT.priceStatus === 'Chưa niêm yết';
          if (isUnlisted) {
            setUnavailableModal({
              isOpen: true,
              title: 'Loại ô kho chưa niêm yết giá',
              message: 'Loại ô kho bạn đang chọn hiện chưa được ban hành giá niêm yết chính thức. Vui lòng chọn loại ô kho khác.',
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

  // 3. Quản lý thời gian thuê & ngày bắt đầu
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

  const endDate = useMemo(() => {
    if (!startDate) return '';
    const [y, m, d] = startDate.split('-').map(Number);
    const date = new Date(y, m - 1 + durationMonths, d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [startDate, durationMonths]);

  // 4. Auth Guard: Yêu cầu đăng nhập trước khi hoàn tất đặt chỗ
  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      const currentUrl = `/customer/booking${window.location.search}`;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [navigate]);

  // 5. Form state & validation
  const currentUser = tokenStorage.getUser();
  const [customerName, setCustomerName] = useState(() => currentUser?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState(() => (currentUser as any)?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(() => currentUser?.email || '');
  const [customerIdCard, setCustomerIdCard] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});

  // 6. Stepper: Bước 2 (Thông tin) hoặc Bước 3 (Thanh toán)
  const [currentStep, setCurrentStep] = useState<2 | 3>(2);

  // 7. Backend Pricing & Sức chứa ô kho
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
        if (isMounted) setBackendPricing(res);
      } catch (err) {
        console.warn('Lỗi gọi API tính giá backend:', err);
      }
    }
    loadPrice();
    return () => { isMounted = false; };
  }, [facilityId, typeId, durationMonths]);

  useEffect(() => {
    if (!reservationIdParam) {
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
    }
  }, [facilityId, typeId, startDate, durationMonths, reservationIdParam]);

  // 8. Bảng giá minh bạch
  const calculation = useMemo(() => {
    const monthlyRate = unitType.baseMonthlyPrice || 0;
    const rawRent = monthlyRate * durationMonths;
    const fallbackDeposit = Math.round((monthlyRate * depositMultiplier) / 1000) * 1000;

    if (backendPricing) {
      return {
        monthlyRate: backendPricing.monthlyPrice || monthlyRate,
        rentalFee: backendPricing.rawRentTotal || rawRent,
        discountPercent: normalizeDiscountPercent(backendPricing.discountPercentage),
        discountAmount: backendPricing.discountAmount || 0,
        discountProgramName: backendPricing.discountProgramName || null,
        finalRentTotal: backendPricing.finalRentTotal || (rawRent - (backendPricing.discountAmount || 0)),
        depositAmount: backendPricing.depositAmount || fallbackDeposit,
        totalDueToday: backendPricing.totalDueToday || ((backendPricing.finalRentTotal || rawRent) + fallbackDeposit),
      };
    }

    return {
      monthlyRate,
      rentalFee: rawRent,
      discountPercent: 0,
      discountAmount: 0,
      discountProgramName: null,
      finalRentTotal: rawRent,
      depositAmount: fallbackDeposit,
      totalDueToday: rawRent + fallbackDeposit,
    };
  }, [unitType, durationMonths, depositMultiplier, backendPricing]);

  // 9. Quản lý luồng Thanh toán VietQR & Hủy đơn qua Custom Hook
  const {
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
    setCreatedReservationCode,
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
  } = useBookingPayment({
    currentStep,
    holdHours,
    facility,
    unitType,
    finalUnitNumber,
    customerName,
    customerPhone,
    customerIdCard,
    startDate,
    calculation,
  });

  // 10. Nạp đơn giữ chỗ 48h nếu có reservationId trên URL (ISS-81)
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
  }, [reservationIdParam, navigate, setCreatedReservationId, setCreatedReservationCode, setReservationHoldExpiresAt, setCheckoutData, setPaymentStatus, setCurrentStep]);

  // 11. Kiểm tra nếu khách hàng đã có đơn giữ chỗ PENDING_PAYMENT khác (BR-RES-02, ISS-99)
  useEffect(() => {
    if (reservationIdParam) return;
    if (!tokenStorage.getAccessToken()) return;
    let isMounted = true;
    async function checkPendingReservation() {
      try {
        const myReservations = await getMyReservationsApi();
        if (!isMounted) return;
        const activePending = myReservations?.find((r) => {
          if (r.status !== 'PENDING_PAYMENT') return false;
          if (!r.holdExpiresAt) return true;
          return new Date(r.holdExpiresAt).getTime() > Date.now();
        });
        if (activePending) {
          setPendingLimitModal({
            isOpen: true,
            pendingReservation: activePending,
          });
        }
      } catch (err) {
        console.error('Không thể kiểm tra đơn giữ chỗ hiện tại:', err);
      }
    }
    checkPendingReservation();
    return () => { isMounted = false; };
  }, [reservationIdParam]);

  // 12. Xử lý gửi Form Đặt Chỗ (Tạo đơn reservation & PayOS checkout)
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenStorage.getAccessToken() || !tokenStorage.getUser()) {
      const currentUrl = `/customer/booking${window.location.search}`;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const errors = validateBookingCustomerForm({
      customerName,
      customerPhone,
      customerEmail,
      customerIdCard,
      agreeTerms,
    });
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
      const errorMsg = err?.message || '';
      if (errorMsg.includes('chưa thanh toán') || errorMsg.includes('giữ chỗ') || err?.status === 409) {
        try {
          const myReservations = await getMyReservationsApi();
          const activePending = myReservations?.find((r) => {
            if (r.status !== 'PENDING_PAYMENT') return false;
            if (!r.holdExpiresAt) return true;
            return new Date(r.holdExpiresAt).getTime() > Date.now();
          });
          if (activePending) {
            setPendingLimitModal({
              isOpen: true,
              pendingReservation: activePending,
            });
            return;
          }
        } catch {
          // fallback
        }
      }
      setBookingError(err?.message || 'Không thể tạo đơn đặt chỗ. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
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
            <BookingCustomerForm
              customerName={customerName}
              setCustomerName={setCustomerName}
              customerPhone={customerPhone}
              setCustomerPhone={setCustomerPhone}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              customerIdCard={customerIdCard}
              setCustomerIdCard={setCustomerIdCard}
              agreeTerms={agreeTerms}
              setAgreeTerms={setAgreeTerms}
              formErrors={formErrors}
              holdHours={holdHours}
              depositMultiplierLabel={depositMultiplierLabel}
              bookingError={bookingError}
              isSubmitting={isSubmitting}
              isCheckingAvailability={isCheckingAvailability}
              isButtonDisabled={availability !== null && availability.availableSlots <= 0}
              onSubmit={handleProceedToPayment}
            />
          </div>

          {/* CỘT PHẢI: TÓM TẮT THÔNG TIN ĐƠN ĐẶT (5 cols) */}
          <div className="lg:col-span-5">
            <BookingSummaryCard
              facilityName={facility.name}
              finalUnitNumber={finalUnitNumber}
              unitTypeName={unitType.name}
              sizeCategory={unitType.sizeCategory}
              areaM2={unitType.areaM2}
              startDate={startDate}
              endDate={endDate}
              durationMonths={durationMonths}
              calculation={calculation}
              depositMultiplierLabel={depositMultiplierLabel}
            />
          </div>
        </div>
      ) : (
        /* ==================== STEP 3: THANH TOÁN VIETQR & GIỮ CHỖ 48H ==================== */
        <BookingPaymentStep
          createdReservationId={createdReservationId}
          checkoutData={checkoutData}
          calculation={calculation}
          formattedCountdown={formattedCountdown}
          copiedField={copiedField}
          handleCopyText={handleCopyText}
          paymentNotice={paymentNotice}
          paymentStatus={paymentStatus}
          redirectCountdown={redirectCountdown}
          isSimulating={isSimulating}
          holdExpired={holdExpired}
          handleSimulateTransfer={handleSimulateTransfer}
          onCancelReservation={() => setShowCancelModal(true)}
          setShowCancelModal={setShowCancelModal}
          isVerifying={isVerifying}
          handleCheckPaymentStatus={handleCheckPaymentStatus}
          facility={facility}
          unitType={unitType}
          finalUnitNumber={finalUnitNumber}
          durationMonths={durationMonths}
          depositMultiplierLabel={depositMultiplierLabel}
        />
      )}

      {/* CỤM 5 MODALS (HỦY ĐƠN, VÉ VÀO CỔNG, ĐIỀU KHOẢN, CẢNH BÁO) */}
      <BookingModals
        showCancelModal={showCancelModal}
        onCloseCancelModal={() => setShowCancelModal(false)}
        onConfirmCancelReservation={handleConfirmCancelReservation}
        isCancellingReservation={isCancellingReservation}
        cancelError={cancelError}
        unavailableModal={unavailableModal}
        onCloseUnavailableModal={() => {
          setUnavailableModal((prev) => ({ ...prev, isOpen: false }));
          navigate(unavailableModal.actionType === 'NAVIGATE_HOME' ? '/customer' : `/customer/units?facility=${facilityId}`);
        }}
        pendingLimitModal={pendingLimitModal}
        onClosePendingLimitModal={() => {
          setPendingLimitModal({ isOpen: false, pendingReservation: null });
          navigate(`/customer/units?facility=${facility.id || ''}`);
        }}
        onPayPendingReservation={(rsv) => {
          setPendingLimitModal({ isOpen: false, pendingReservation: null });
          if (rsv) {
            navigate(`/customer/booking?facility=${rsv.facilityId}&reservationId=${rsv.id}`);
          }
        }}
        showPassModal={showPassModal}
        createdPass={createdPass}
        onClosePassModal={() => setShowPassModal(false)}
        showTermsModal={showTermsModal}
        onCloseTermsModal={() => setShowTermsModal(false)}
      />

    </div>
  );
};
