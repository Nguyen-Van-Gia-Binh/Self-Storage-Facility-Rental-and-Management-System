import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Calendar, 
  User, 
  QrCode, 
  Clock, 
  Copy, 
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  Loader2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { calculateBookingTotal, formatVND } from '../utils/pricing';
import { BookingPriceSummary } from '../components/BookingPriceSummary';
import { DigitalMoveInPassModal } from '../components/DigitalMoveInPassModal';
import { generateMoveInPass } from '@/api/payment';
import { customerApi } from '../api/customerApi';
import type { CheckoutResponse } from '../api/customerApi';
import {
  calculateBookingPrice,
  createReservation,
  checkUnitAvailability,
  type AvailabilityResponse,
  type CalculatePriceResponse,
} from '@/api/reservation';
import type { BookingDraft } from '../types';
import type { MoveInPassData } from '@/types';
import { fetchFacilities } from '@/api/facility';
import { fetchUnitTypes as fetchUnitTypesApi } from '@/api/unit';
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityId = searchParams.get('facility') || searchParams.get('facilityId') || '8';
  const typeId = searchParams.get('type') || searchParams.get('typeId') || '1';
  const unitNumberParam = searchParams.get('unitNumber');
  const unitIdParam = searchParams.get('unitId');

  const [facility, setFacility] = useState<Facility>({
    id: facilityId,
    code: `FAC-${facilityId}`,
    name: 'Cơ sở lưu trữ',
    address: 'Số 88 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    district: 'Hải Châu',
    city: 'Đà Nẵng',
    distance: '1.2 km',
    startingPrice: 45000,
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
    phone: '0236-365-7788',
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
    baseMonthlyPrice: 450000,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const facList = await fetchFacilities();
        if (!isMounted) return;
        const matched = facList.find(
          (f: FacilityListItem) => String(f.id) === facilityId || f.code === facilityId
        ) || facList.find((f: FacilityListItem) => f.id === 8) || facList[0];

        if (matched) {
          setFacility({
            id: String(matched.id),
            code: matched.code || `FAC-${matched.id}`,
            name: matched.name,
            address: matched.address || 'Đà Nẵng',
            district: 'Hải Châu',
            city: 'Đà Nẵng',
            distance: '1.2 km',
            startingPrice: 45000,
            image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80',
            phone: '0236-365-7788',
          });

          const numericId = typeof matched.id === 'number' ? matched.id : Number(matched.id);
          const utPage = await fetchUnitTypesApi(numericId, { size: 50 });
          if (!isMounted) return;

          if (utPage?.content && utPage.content.length > 0) {
            const foundUT = utPage.content.find(
              (ut) => String(ut.id) === typeId || ut.code === typeId
            ) || utPage.content[0];

            if (foundUT) {
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
                baseMonthlyPrice: foundUT.monthlyPrice || 450000,
              });
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin cơ sở & loại kho cho trang Booking:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [facilityId, typeId]);

  const finalUnitNumber = unitNumberParam || (unitType.name ? `${unitType.name} (Tự động phân bổ)` : 'Tự động phân bổ');
  const finalUnitId = unitIdParam || undefined;

  // Form State
  const monthsParam = parseInt(searchParams.get('months') || '', 10);
  const startDateParam = searchParams.get('startDate');

  const [durationMonths] = useState<number>(
    !isNaN(monthsParam) && monthsParam > 0 ? monthsParam : 3
  );
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [startDate] = useState<string>(() => {
    if (startDateParam && startDateParam >= todayStr) {
      return startDateParam;
    }
    return todayStr;
  });

  const [customerName, setCustomerName] = useState('Nguyễn Văn An');
  const [customerPhone, setCustomerPhone] = useState('0912 345 678');
  const [customerEmail, setCustomerEmail] = useState('an.nguyen@example.com');
  const [customerIdCard, setCustomerIdCard] = useState('079098012345');
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
  const [copiedBankInfo, setCopiedBankInfo] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [createdPass, setCreatedPass] = useState<MoveInPassData | null>(null);

  // Payment States (SC-03)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [createdReservationId, setCreatedReservationId] = useState<number | null>(null);
  const [createdReservationCode, setCreatedReservationCode] = useState<string>('');

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

  // Backend Availability & Real Pricing States (SC-01, SC-02)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [backendPricing, setBackendPricing] = useState<CalculatePriceResponse | null>(null);

  // Tải sức chứa ô kho thực tế từ backend (SC-01)
  useEffect(() => {
    let isMounted = true;
    async function loadAvailability() {
      const fId = parseInt(facilityId, 10) || 1;
      const uId = parseInt(typeId, 10) || 1;
      try {
        const res = await checkUnitAvailability(fId, uId, startDate, durationMonths);
        if (isMounted) {
          setAvailability(res);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra availability từ backend:', err);
      }
    }
    loadAvailability();
    return () => { isMounted = false; };
  }, [facilityId, typeId, startDate, durationMonths]);

  // Tải tính giá tự động từ backend (SC-02, BR-DEP-01, BR-GEN-04)
  useEffect(() => {
    let isMounted = true;
    async function loadPrice() {
      if (unitType.baseMonthlyPrice > 0 && durationMonths > 0) {
        try {
          const res = await calculateBookingPrice({
            monthlyPrice: unitType.baseMonthlyPrice,
            months: durationMonths,
          });
          if (isMounted) {
            setBackendPricing(res);
          }
        } catch (err) {
          console.warn('Lỗi gọi API tính giá backend:', err);
        }
      }
    }
    loadPrice();
    return () => { isMounted = false; };
  }, [unitType.baseMonthlyPrice, durationMonths]);

  // Price Calculation
  const calculation = useMemo(() => {
    if (backendPricing) {
      return {
        monthlyRate: backendPricing.monthlyPrice,
        months: backendPricing.rentalMonths,
        rawRentTotal: backendPricing.rawRentTotal,
        discountPercentage: backendPricing.discountPercentage,
        discountAmount: backendPricing.discountAmount,
        finalRentTotal: backendPricing.finalRentTotal,
        depositAmount: backendPricing.depositAmount,
        totalDueToday: backendPricing.totalDueToday,
      };
    }
    return calculateBookingTotal(unitType.baseMonthlyPrice, durationMonths);
  }, [backendPricing, unitType.baseMonthlyPrice, durationMonths]);

  // Xử lý tạo MoveInPass khi đã thanh toán thành công (SC-03, BR-ACC-01)
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
      checkInWindow: 'Trong vòng 48 giờ kể từ lúc cọc',
      totalPaid: checkoutData?.amount || calculation.totalDueToday,
    });
    setCreatedPass(pass);
    setShowPassModal(true);
  }, [
    createdReservationId,
    createdReservationCode,
    checkoutData?.amount,
    calculation.totalDueToday,
    finalUnitNumber,
    facility.id,
    facility.name,
    facility.address,
    facility.phone,
    customerName,
    customerPhone,
    customerIdCard,
    startDate,
  ]);

  // Kiểm tra trạng thái thanh toán chủ động (Nút Kiểm tra / Nhận vé)
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
        // Chưa thanh toán thành công (BR-ACC-01): Tuyệt đối không sinh pass
        setPaymentNotice('Hệ thống chưa ghi nhận thanh toán. Vui lòng quét mã hoặc bấm nút xác nhận chuyển khoản trước khi nhận vé!');
      }
    } catch (err) {
      console.error('Lỗi kiểm tra đối soát thanh toán:', err);
      setPaymentNotice('Lỗi kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Đồng hồ đếm ngược giữ chỗ 48 giờ thực tế (BR-DEP-03)
  const [secondsLeft, setSecondsLeft] = useState<number>(48 * 3600 - 15); // 47h 59m 45s

  useEffect(() => {
    if (currentStep !== 3) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep]);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number>(3);

  // Xử lý mô phỏng chuyển tiền Sandbox trực tiếp
  const handleSimulateTransfer = async () => {
    if (!checkoutData?.orderCode) return;
    setIsSimulating(true);
    setPaymentNotice(null);
    try {
      await customerApi.processSandboxTransfer(checkoutData.orderCode, 'TRANSFER_SUCCESS');
      setPaymentStatus('SUCCESS');
      handleConfirmBookingPayment();
    } catch (err: any) {
      console.error('Lỗi khi mô phỏng chuyển tiền:', err);
      setPaymentNotice(err?.message || 'Không thể xác nhận chuyển tiền Sandbox. Vui lòng thử lại!');
    } finally {
      setIsSimulating(false);
    }
  };

  // Tự động đếm ngược và chuyển tới trang My Units sau khi thanh toán thành công
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

  // Polling trạng thái thanh toán từ Backend (SC-03)
  useEffect(() => {
    if (currentStep !== 3 || !checkoutData?.orderCode || paymentStatus === 'SUCCESS') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await customerApi.getPaymentStatus(checkoutData.orderCode);
        if (res && res.status === 'SUCCESS') {
          setPaymentStatus('SUCCESS');
          clearInterval(pollInterval);
          // Tự động mở thẻ nhận kho và hoàn tất đặt chỗ
          handleConfirmBookingPayment();
        } else if (res && res.status === 'FAILED') {
          setPaymentStatus('FAILED');
          clearInterval(pollInterval);
        }
      } catch (err) {
        // Polling retry quietly
      }
    }, 2000);

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
      errors.customerPhone = 'Số điện thoại không hợp lệ (cần 10 số đầu 03, 05, 07, 08, 09).';
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
      errors.agreeTerms = 'Bạn cần đồng ý với nội quy lưu trữ và điều khoản cọc để tiếp tục.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Chuyển đổi mã cơ sở và loại ô sang ID số nếu cần
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

      // 2. Tạo Reservation trong backend qua module reservation chuẩn (SC-02)
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

      // 3. Khởi tạo PayOS VietQR payment link thật
      const checkout = await customerApi.createPaymentCheckout({
        referenceType: 'RESERVATION',
        referenceId: rsvId,
        description: `DH${rsvId}`,
      });

      setCheckoutData(checkout);
      setPaymentStatus('PENDING');

      // 4. Lưu draft vào localStorage
      const draft: BookingDraft = {
        facilityId: facility.id,
        facilityName: facility.name,
        unitId: finalUnitId || 'AUTO',
        unitNumber: rsv.storageUnitCode || finalUnitNumber,
        unitTypeId: unitType.id,
        unitTypeName: unitType.name,
        storageType: unitType.storageType,
        areaM2: unitType.areaM2,
        monthlyRent: unitType.baseMonthlyPrice,
        durationMonths,
        startDate,
        endDate,
        depositAmount: calculation.depositAmount,
        totalUpfront: checkout.amount || calculation.totalDueToday,
        customerName,
        customerPhone,
        customerEmail,
        customerIdentityNumber: customerIdCard,
        holdExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      };

      try {
        localStorage.setItem('smartstorage_pending_booking', JSON.stringify(draft));
      } catch {
        // Bỏ qua
      }

      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      console.error('Lỗi khi khởi tạo đơn đặt chỗ hoặc PayOS:', err);
      const msg = (err as any)?.message || (err instanceof Error ? err.message : 'Không thể tạo mã thanh toán PayOS. Vui lòng kiểm tra lại kết nối!');
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferContent = checkoutData?.description || (createdReservationCode ? `SMARTSTORAGE ${createdReservationCode}` : `SMARTSTORAGE ${customerIdCard.slice(-4)}`);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-6">
      {/* Top Stepper Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <Link
            to={`/customer/units?facility=${facility.id}&type=${unitType.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại sơ đồ mặt bằng chọn ô khác
          </Link>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a1614] tracking-tight">
            {currentStep === 2 ? 'Xác Nhận Hồ Sơ Đặt Chỗ' : 'Thanh Toán Giữ Chỗ VietQR (48 Giờ)'}
          </h1>
        </div>

        {/* Stepper pills */}
        <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
          <Link 
            to={`/customer/units?facility=${facility.id}&type=${unitType.id}`}
            className="flex items-center gap-1.5 text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 hover:bg-brand-100"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chọn loại & Sơ đồ</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
            currentStep === 2 
              ? 'bg-brand-500 text-white border-brand-500 shadow-xs' 
              : 'text-brand-600 bg-brand-50 border-brand-200'
          }`}>
            <span className="w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Hồ sơ đặt chỗ</span>
          </div>
          <span className="text-slate-300">/</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
            currentStep === 3 
              ? 'bg-brand-500 text-white border-brand-500 shadow-xs' 
              : 'text-slate-400 bg-slate-50 border-slate-200'
          }`}>
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              currentStep === 3 ? 'bg-white text-brand-700' : 'bg-slate-200 text-slate-500'
            }`}>3</span>
            <span>Thanh toán VietQR</span>
          </div>
        </div>
      </div>

      {currentStep === 2 ? (
        /* STEP 2: CUSTOMER PROFILE & RESERVATION (SCR-SC-02 & SCR-SC-02B) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Column (2/3) */}
          <form onSubmit={handleProceedToPayment} className="lg:col-span-2 space-y-5">
            {/* Unit Selected Overview from Floorplan */}
            <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 font-mono">
                      Ngăn kho {finalUnitNumber}
                    </span>
                    <Badge variant="available" className="text-[10px] px-1.5 py-0.5">
                      Sẵn sàng nhận kho
                    </Badge>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0a1614] mt-1.5">
                    {unitType.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kích thước: {unitType.dimensions} ({unitType.areaM2} m² / {unitType.volumeM3} m³)
                  </p>
                </div>
                <div className="text-left sm:text-right sm:border-l sm:border-slate-100 sm:pl-5">
                  <span className="text-[11px] text-slate-400 block">Đơn giá cơ sở</span>
                  <span className="text-base sm:text-lg font-bold text-brand-600">
                    {formatVND(unitType.baseMonthlyPrice)}
                  </span>
                  <span className="text-xs text-slate-500">/tháng</span>
                </div>
              </div>

              {/* Sức chứa ô kho trống từ Backend (SC-01) */}
              {availability && (
                <div className={`p-3 rounded-xl flex items-center justify-between text-xs border ${
                  availability.availableSlots > 0 
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50/70 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${availability.availableSlots > 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                    <span className="font-semibold">
                      {availability.availableSlots > 0
                        ? `Còn ${availability.availableSlots} ô kho trống sẵn sàng trong kỳ hạn này`
                        : 'Loại ô kho này đã hết chỗ trong kỳ hạn đã chọn. Vui lòng đổi ngày hoặc loại kho khác!'}
                    </span>
                  </div>
                  {availability.availableSlots > 0 && (
                    <Badge variant="available" className="text-[10px]">
                      Trống {availability.availableSlots} ô
                    </Badge>
                  )}
                </div>
              )}

              {/* Tóm tắt thời hạn thuê đã chọn từ sơ đồ (Read-only) */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    Thời hạn thuê đã chọn: <strong className="text-slate-900 font-extrabold">{durationMonths} tháng</strong> (từ <strong className="text-slate-900">{formatDateVN(startDate)}</strong> đến <strong className="text-slate-900">{formatDateVN(endDate)}</strong>)
                  </span>
                </div>
                <Link
                  to={`/customer/units?facility=${facility.id}&type=${unitType.id}&startDate=${startDate}&months=${durationMonths}`}
                  className="text-brand-600 hover:text-brand-700 font-semibold underline text-xs shrink-0 self-start sm:self-auto"
                >
                  Thay đổi thời gian
                </Link>
              </div>
            </Card>

            {/* Customer Identification (SCR-SC-02B & BR-CHK-01) */}
            <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-sm sm:text-base font-bold text-[#0a1614] flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-600" />
                  Thông tin khách hàng & Định danh nhận kho
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số CCCD/Hộ chiếu dùng để nhân viên đối chiếu và bàn giao chìa khóa thông minh tại cơ sở.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Input
                    label="Họ và tên đầy đủ"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formErrors.customerName) setFormErrors({ ...formErrors, customerName: undefined });
                    }}
                    required
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="Số điện thoại di động"
                    placeholder="Ví dụ: 0912 345 678"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      if (formErrors.customerPhone) setFormErrors({ ...formErrors, customerPhone: undefined });
                    }}
                    required
                  />
                  {formErrors.customerPhone && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Input
                    label="Địa chỉ Email"
                    type="email"
                    placeholder="an.nguyen@example.com"
                    helperText="Dùng để nhận hợp đồng điện tử và biên nhận thanh toán"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      if (formErrors.customerEmail) setFormErrors({ ...formErrors, customerEmail: undefined });
                    }}
                    required
                  />
                  {formErrors.customerEmail && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.customerEmail}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="Số Căn cước công dân / Hộ chiếu (9-12 số)"
                    placeholder="079098012345"
                    helperText="Bắt buộc để cấp quyền mở cửa bảo mật tại cơ sở"
                    value={customerIdCard}
                    onChange={(e) => {
                      setCustomerIdCard(e.target.value);
                      if (formErrors.customerIdCard) setFormErrors({ ...formErrors, customerIdCard: undefined });
                    }}
                    required
                  />
                  {formErrors.customerIdCard && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.customerIdCard}
                    </p>
                  )}
                </div>
              </div>

              {/* Điều khoản & Quy tắc hủy/hoàn cọc */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-brand-600" /> Quy định đặt chỗ & hoàn cọc:
                  </p>
                  <p>• Khách được hủy đặt chỗ và hoàn cọc 100% nếu thông báo trước 24 giờ kể từ ngày bắt đầu thuê.</p>
                  <p>• Khách trả kho trước hạn hợp đồng không được hoàn lại tiền thuê các tháng còn lại.</p>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (formErrors.agreeTerms) setFormErrors({ ...formErrors, agreeTerms: undefined });
                    }}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                    required
                  />
                  <span>
                    Tôi cam kết thông tin CCCD là chính xác, đồng ý với các quy định lưu trữ an toàn PCCC và các điều khoản hoàn tiền nêu trên.
                  </span>
                </label>
                {formErrors.agreeTerms && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.agreeTerms}
                  </p>
                )}
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(`/customer/units?facility=${facility.id}&type=${unitType.id}`)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="px-6 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang khởi tạo mã PayOS...</span>
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

          {/* Pricing Column (1/3) */}
          <div className="lg:col-span-1">
            <BookingPriceSummary
              unitType={unitType}
              facility={facility}
              calculation={calculation}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        </div>
      ) : (
        /* STEP 3: VIETQR PAYMENT & 48H HOLD CONFIRMATION (SCR-SC-03) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-5">
              {/* Payment Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đơn đặt chỗ ngăn kho {finalUnitNumber} đã tạo thành công
                  </div>
                  <h2 className="text-xl font-bold text-[#0a1614]">
                    Quét Mã VietQR Chuyển Khoản Nhanh 24/7 (Sandbox)
                  </h2>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Thời gian giữ chỗ còn lại:</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7c94c3] bg-[#7c94c3]/10 px-2.5 py-1 rounded-lg mt-0.5 font-mono tabular-nums">
                    <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                    {formattedCountdown}
                  </span>
                </div>
              </div>

              {/* Success Banner with Pass Code & PIN */}
              {paymentStatus === 'SUCCESS' && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-amber-300 flex-shrink-0 animate-bounce" />
                    <div>
                      <h3 className="font-extrabold text-base text-white">Thanh Toán Hoàn Tất Thành Công!</h3>
                      <p className="text-xs text-emerald-100">
                        Mã nhận kho: <span className="font-mono font-bold text-amber-300 text-sm">{createdPass?.reservationId || createdReservationCode}</span>
                        {createdPass?.passCode && <span> · Mã thẻ mở kho: <span className="font-mono font-bold text-amber-300 text-sm">{createdPass.passCode}</span></span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-100 font-medium">Chuyển tới Kho trong {redirectCountdown}s...</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/customer/my-units')}
                      className="bg-white text-emerald-800 font-bold hover:bg-emerald-50 text-xs shrink-0 cursor-pointer"
                    >
                      Vào kho ngay
                    </Button>
                  </div>
                </div>
              )}

              {/* Live Polling Status Alert */}
              {paymentStatus === 'PENDING' && (
                <div className="bg-sky-50 border border-sky-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-sky-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                    <span>Hệ thống đang tự động lắng nghe Webhook... (Tự động hiển thị mã mở kho ngay khi chuyển tiền xong)</span>
                  </div>
                  {checkoutData?.checkoutUrl && (
                    <a
                      href={checkoutData.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline shrink-0 cursor-pointer"
                    >
                      <span>Mở trang thanh toán tab mới</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {paymentStatus === 'FAILED' && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-rose-900 font-bold shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Giao dịch thanh toán đã bị hủy. Bạn có thể bấm xác nhận lại bên dưới.</span>
                </div>
              )}

              {/* QR Code & Banking details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* QR Display */}
                <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    {checkoutData?.qrCode ? (
                      <QRCodeSVG
                        value={checkoutData.qrCode}
                        size={175}
                        level="M"
                        includeMargin={true}
                      />
                    ) : (
                      <img
                        src={`https://img.vietqr.io/image/970422-0888567999-compact2.png?amount=${checkoutData?.amount || calculation.totalDueToday}&addInfo=${encodeURIComponent(checkoutData?.description || transferContent)}&accountName=${encodeURIComponent(checkoutData?.accountName || 'SMARTSTORAGE')}`}
                        alt="VietQR Code"
                        className="w-40 h-40 object-contain"
                      />
                    )}
                    <span className="text-[11px] font-bold text-slate-600 mt-2 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-blue-600" />
                      VietQR · MB Bank (Sandbox)
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-2.5 text-center">
                    Quét mã bằng Camera/Zalo/Điện thoại để chuyển tiền
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-3 text-xs">
                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Ngân hàng thụ hưởng:</span>
                    <strong className="text-sm text-[#0a1614] font-bold">
                      MB Bank (Ngân hàng Quân Đội · Napas247)
                    </strong>
                  </div>

                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Số tài khoản định danh:</span>
                      <strong className="text-sm text-[#0a1614] font-bold tracking-wider font-mono">
                        {checkoutData?.accountNumber || '0888567999'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(checkoutData?.accountNumber || '0888567999')}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Chủ tài khoản:</span>
                    <strong className="text-sm text-[#0a1614] font-bold uppercase">
                      {checkoutData?.accountName || 'CONG TY CP SMARTSTORAGE VIET NAM'}
                    </strong>
                  </div>

                  <div className="bg-emerald-50/80 p-3 rounded-lg border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-800 font-semibold block">Số tiền cần thanh toán:</span>
                      <strong className="text-base text-emerald-950 font-extrabold tracking-tight">
                        {formatVND(checkoutData?.amount || calculation.totalDueToday)}
                      </strong>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-amber-800 font-semibold block">Nội dung chuyển khoản (Bắt buộc):</span>
                      <strong className="text-sm text-amber-950 font-bold tracking-wider font-mono">
                        {checkoutData?.description || transferContent}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(checkoutData?.description || transferContent)}
                      className="p-1.5 text-amber-700 hover:text-amber-900 rounded cursor-pointer"
                      title="Sao chép nội dung"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Nút mô phỏng chuyển tiền Sandbox trực tiếp */}
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      onClick={handleSimulateTransfer}
                      disabled={isSimulating || paymentStatus === 'SUCCESS'}
                    >
                      {isSimulating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang xử lý chuyển tiền Sandbox...</span>
                        </>
                      ) : paymentStatus === 'SUCCESS' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã Chuyển Tiền Thành Công</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Xác Nhận Đã Chuyển Tiền (Mô Phỏng Sandbox)</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {copiedBankInfo && (
                    <div className="text-center text-emerald-600 font-semibold text-xs py-1">
                      ✓ Đã sao chép vào bộ nhớ tạm!
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Notice / Alert */}
              {paymentNotice && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{paymentNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentNotice(null)}
                    className="text-amber-700 hover:text-amber-900 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Security & Access Code Notice: BR-ACC-01 */}
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Bảo mật truy cập:</strong> Thẻ nhận kho và mã PIN mở ngăn tủ chỉ được cấp ngay sau khi hệ thống ghi nhận thanh toán cọc thành công.
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Sửa lại thông tin
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCheckPaymentStatus}
                    disabled={isVerifying || paymentStatus === 'SUCCESS'}
                    className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs font-bold whitespace-nowrap"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra đối soát...</span>
                      </>
                    ) : paymentStatus === 'SUCCESS' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã thanh toán thành công</span>
                      </>
                    ) : (
                      <>
                        <span>Tôi đã chuyển khoản / Lấy vé nhận kho</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Pricing Column (1/3) */}
          <div className="lg:col-span-1">
            <BookingPriceSummary
              unitType={unitType}
              facility={facility}
              calculation={calculation}
              startDate={startDate}
              endDate={endDate}
            />
          </div>
        </div>
      )}

      {/* Digital Move-in Pass Modal (SCR-SC-03.1) */}
      <DigitalMoveInPassModal
        isOpen={showPassModal}
        onClose={() => {
          setShowPassModal(false);
          navigate('/customer/my-units');
        }}
        passData={createdPass}
      />
    </div>
  );
};
