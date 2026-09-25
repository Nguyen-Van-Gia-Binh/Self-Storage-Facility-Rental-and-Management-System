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
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { calculateBookingTotal, formatVND } from '../utils/pricing';
import { BookingPriceSummary } from '../components/BookingPriceSummary';
import { DigitalMoveInPassModal } from '../components/DigitalMoveInPassModal';
import { generateMoveInPass } from '@/api/payment';
import { customerApi } from '../api/customerApi';
import type { CheckoutResponse } from '../api/customerApi';
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

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityId = searchParams.get('facility') || '8';
  const typeId = searchParams.get('type') || '1';
  const unitNumberParam = searchParams.get('unitNumber') || 'S-101';
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

  const finalUnitNumber = unitNumberParam || 'S-101';
  const finalUnitId = unitIdParam || '1';

  // Form State
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [startDate, setStartDate] = useState<string>(todayStr);

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

  // PayOS Payment States (SC-03)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [checkoutData, setCheckoutData] = useState<CheckoutResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [createdReservationId, setCreatedReservationId] = useState<number | null>(null);
  const [createdReservationCode, setCreatedReservationCode] = useState<string>('');

  // Calculate End Date
  const endDate = useMemo(() => {
    if (!startDate) return '';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + durationMonths);
    return d.toISOString().split('T')[0];
  }, [startDate, durationMonths]);

  // Price Calculation
  const calculation = useMemo(() => {
    return calculateBookingTotal(unitType.baseMonthlyPrice, durationMonths);
  }, [unitType, durationMonths]);

  // Xử lý xác nhận thanh toán đặt chỗ & tạo MoveInPass (SC-03)
  const handleConfirmBookingPayment = useCallback(async () => {
    // Nếu chưa ở trạng thái SUCCESS (ví dụ bấm nút demo thủ công), gọi backend API để ghi nhận và kích hoạt tạo hợp đồng
    if (createdReservationId && paymentStatus !== 'SUCCESS') {
      try {
        await customerApi.createManualPayment({
          referenceType: 'RESERVATION',
          referenceId: createdReservationId,
          amount: checkoutData?.amount || calculation.totalDueToday,
          method: 'BANK_TRANSFER',
          transactionRef: checkoutData?.orderCode ? `PAYOS-${checkoutData.orderCode}` : `TXN-${Date.now()}`,
        });
        setPaymentStatus('SUCCESS');
      } catch (err) {
        console.warn('Lỗi ghi nhận thanh toán backend (vẫn tiếp tục tạo vé nhận kho):', err);
      }
    }

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
    paymentStatus,
    checkoutData?.amount,
    checkoutData?.orderCode,
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

  // Đồng hồ đếm ngược giữ chỗ 48 giờ thực tế (BR-DEP-03)
  const [secondsLeft, setSecondsLeft] = useState<number>(48 * 3600 - 15); // 47h 59m 45s

  useEffect(() => {
    if (currentStep !== 3) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Polling trạng thái thanh toán từ PayOS qua Backend (SC-03)
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
        if (match) numericUnitId = parseInt(match[0], 10);
      }

      // 2. Tạo Reservation trong backend
      const rsv = await customerApi.createReservation({
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
      setCreatedReservationCode(rsv.code || `RSV-${finalUnitNumber}`);

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
        unitId: finalUnitId,
        unitNumber: finalUnitNumber,
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
      const msg = err instanceof Error ? err.message : 'Không thể tạo mã thanh toán PayOS. Vui lòng kiểm tra lại kết nối!';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const transferContent = checkoutData?.description || `SMARTSTORAGE ${finalUnitNumber} ${customerIdCard.slice(-4)}`;

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
            {currentStep === 2 ? 'Xác Nhận Thời Hạn & Hồ Sơ Đặt Chỗ' : 'Thanh Toán Giữ Chỗ VietQR (48 Giờ)'}
          </h1>
        </div>

        {/* Stepper pills */}
        <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
          <Link 
            to={`/customer/units?facility=${facility.id}&type=${unitType.id}`}
            className="flex items-center gap-1.5 text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 hover:bg-brand-100"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1. Chọn loại & Sơ đồ</span>
          </Link>
          <span className="text-slate-300">/</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors ${
            currentStep === 2 
              ? 'bg-brand-500 text-white border-brand-500 shadow-xs' 
              : 'text-brand-600 bg-brand-50 border-brand-200'
          }`}>
            <span className="w-4 h-4 rounded-full bg-white text-brand-700 text-[10px] flex items-center justify-center font-bold">2</span>
            <span>2. Thời hạn & Hồ sơ</span>
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
            <span>3. Thanh toán VietQR</span>
          </div>
        </div>
      </div>

      {currentStep === 2 ? (
        /* STEP 2: DURATION & CUSTOMER FORM (SCR-SC-02 & SCR-SC-02B) */
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

              {/* Duration Options */}
              <div className="pt-2 space-y-2.5">
                <label className="block text-sm font-semibold text-[#0a1614]">
                  Chọn gói thời hạn thuê:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { months: 1, label: '1 Tháng', discountTag: null },
                    { months: 3, label: '3 Tháng', discountTag: 'Phổ biến' },
                    { months: 6, label: '6 Tháng', discountTag: 'Tiết kiệm 5%' },
                    { months: 12, label: '12 Tháng', discountTag: 'Tiết kiệm 10%' },
                  ].map((pkg) => {
                    const isSelected = durationMonths === pkg.months;
                    return (
                      <button
                        key={pkg.months}
                        type="button"
                        onClick={() => setDurationMonths(pkg.months)}
                        className={`p-3 rounded-xl border text-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {pkg.discountTag && (
                          <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                            pkg.months >= 6 
                              ? 'bg-[#7c94c3] text-white' 
                              : 'bg-brand-500 text-white'
                          }`}>
                            {pkg.discountTag}
                          </span>
                        )}
                        <span className={`block font-bold text-sm ${isSelected ? 'text-brand-700' : 'text-[#0a1614]'}`}>
                          {pkg.label}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {formatVND(
                            pkg.months >= 12
                              ? unitType.baseMonthlyPrice * 0.9
                              : pkg.months >= 6
                              ? unitType.baseMonthlyPrice * 0.95
                              : unitType.baseMonthlyPrice
                          )}/tháng
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Date Selection */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    Ngày bắt đầu thuê kho:
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ngày kết thúc dự kiến:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    readOnly
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </Card>

            {/* Customer Identification (SCR-SC-02B & BR-CHK-01) */}
            <Card className="p-4 sm:p-5 bg-white border border-slate-200/90 rounded-xl space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h3 className="text-sm sm:text-base font-bold text-[#0a1614] flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-600" />
                  Thông tin khách hàng & Định danh nhận kho (BR-CHK-01)
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
                    helperText="Bắt buộc theo BR-CHK-01 để cấp quyền mở cửa"
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
                    Quét Mã VietQR Chuyển Khoản Nhanh 24/7
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

              {/* Live Polling Status Alert */}
              {paymentStatus === 'PENDING' && (
                <div className="bg-sky-50 border border-sky-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-sky-900 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                    <span>Hệ thống đang tự động lắng nghe Webhook... (Tự động mở thẻ nhận kho ngay khi bạn chuyển tiền thành công)</span>
                  </div>
                  {checkoutData?.checkoutUrl && (
                    <a
                      href={checkoutData.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 underline shrink-0 cursor-pointer"
                    >
                      <span>Mở cổng PayOS</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {paymentStatus === 'SUCCESS' && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 font-bold shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>✓ Đã nhận thanh toán thành công! Hệ thống đang kích hoạt hợp đồng và mở thẻ nhận kho...</span>
                </div>
              )}

              {paymentStatus === 'FAILED' && (
                <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-rose-900 font-bold shadow-2xs">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>Giao dịch thanh toán đã bị hủy hoặc thất bại từ phía ngân hàng. Bạn có thể thử lại.</span>
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
                        src={`https://img.vietqr.io/image/970415-${checkoutData?.accountNumber || '0888567999'}-compact2.png?amount=${checkoutData?.amount || calculation.totalDueToday}&addInfo=${encodeURIComponent(checkoutData?.description || transferContent)}&accountName=${encodeURIComponent(checkoutData?.accountName || 'SMARTSTORAGE')}`}
                        alt="VietQR Code"
                        className="w-40 h-40 object-contain"
                      />
                    )}
                    <span className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-brand-600" />
                      VietQR · Napas247 PayOS
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 mt-2.5 text-center">
                    Mở ứng dụng ngân hàng bất kỳ để quét mã
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-3 text-xs">
                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Ngân hàng thụ hưởng:</span>
                    <strong className="text-sm text-[#0a1614] font-bold">
                      {checkoutData?.bin === '970415' ? 'VietinBank (Napas247 · PayOS)' : 'VietinBank / Napas247'}
                    </strong>
                  </div>

                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Số tài khoản định danh:</span>
                      <strong className="text-sm text-[#0a1614] font-bold tracking-wider font-mono">
                        {checkoutData?.accountNumber || '0888 567 999'}
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

                  {copiedBankInfo && (
                    <div className="text-center text-emerald-600 font-semibold text-xs py-1">
                      ✓ Đã sao chép vào bộ nhớ tạm!
                    </div>
                  )}
                </div>
              </div>

              {/* Demo Notice for Defense Presentation */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Chế độ Demo / Thuyết trình:</strong> Bạn có thể quét mã VietQR thật ở trên qua App ngân hàng HOẶC bấm nút hoàn tất bên dưới để hệ thống lập tức kích hoạt thanh toán và tự động tạo Hợp đồng sang Portal Quản lý!
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
                    onClick={handleConfirmBookingPayment}
                    className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Tôi đã chuyển khoản / Lấy vé nhận kho</span>
                    <ArrowRight className="w-4 h-4" />
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
