import React, { useState, useMemo, useEffect } from 'react';
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
  MapPin,
  FileText
} from 'lucide-react';
import { mockFacilities, mockUnitTypes, mockStorageUnits } from '../mockData';
import { calculateBookingTotal, formatVND } from '../utils/pricing';
import { BookingPriceSummary } from '../components/BookingPriceSummary';
import { DigitalMoveInPassModal } from '../components/DigitalMoveInPassModal';
import { generateMoveInPass } from '@/api/payment';
import type { BookingDraft } from '../types';
import type { MoveInPassData } from '@/types';

export const BookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const facilityId = searchParams.get('facility') || 'FAC-D7-02';
  const typeId = searchParams.get('type') || 'UT-M-STD';
  const unitNumberParam = searchParams.get('unitNumber') || 'A102';
  const unitIdParam = searchParams.get('unitId');

  const facility = useMemo(() => {
    return mockFacilities.find((f) => f.id === facilityId) || mockFacilities[0];
  }, [facilityId]);

  const unitType = useMemo(() => {
    return mockUnitTypes.find((t) => t.id === typeId) || mockUnitTypes[0];
  }, [typeId]);

  // Tra cứu chi tiết ô kho từ sơ đồ mặt bằng
  const targetUnit = useMemo(() => {
    if (unitIdParam) {
      const found = mockStorageUnits.find((u) => u.id === unitIdParam);
      if (found) return found;
    }
    const foundByNum = mockStorageUnits.find(
      (u) => u.unitNumber === unitNumberParam && u.facilityId === facility.id
    );
    if (foundByNum) return foundByNum;

    return (
      mockStorageUnits.find((u) => u.facilityId === facility.id && u.status === 'AVAILABLE') || null
    );
  }, [unitIdParam, unitNumberParam, facility.id]);

  const finalUnitNumber = targetUnit ? targetUnit.unitNumber : unitNumberParam;
  const finalUnitId = targetUnit ? targetUnit.id : 'U-A102';

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

  // Đồng hồ đếm ngược giữ chỗ 48 giờ thực tế (BR-DEP-03)
  const [secondsLeft, setSecondsLeft] = useState<number>(48 * 3600 - 15); // 47h 59m 45s

  useEffect(() => {
    if (currentStep !== 3) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep]);

  const formattedCountdown = useMemo(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }, [secondsLeft]);

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
      errors.customerIdCard = 'Số CCCD / Hộ chiếu phải gồm 9 đến 12 chữ số theo quy định BR-CHK-01.';
    }

    if (!agreeTerms) {
      errors.agreeTerms = 'Bạn cần đồng ý với nội quy lưu trữ và điều khoản cọc để tiếp tục.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Lưu thông tin đơn đặt chỗ tạm thời (Booking Draft) vào localStorage
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
      totalUpfront: calculation.totalDueToday,
      customerName,
      customerPhone,
      customerEmail,
      customerIdentityNumber: customerIdCard,
      holdExpiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    };

    try {
      localStorage.setItem('smartstorage_pending_booking', JSON.stringify(draft));
    } catch {
      // Bỏ qua nếu môi trường không cho phép truy cập localStorage
    }

    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const transferContent = `SMARTSTORAGE ${finalUnitNumber} ${customerIdCard.slice(-4)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
  };

  const handleConfirmBookingPayment = () => {
    const pass = generateMoveInPass({
      reservationId: `RES-${finalUnitNumber}`,
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
      totalPaid: calculation.totalDueToday,
    });
    setCreatedPass(pass);
    setShowPassModal(true);
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
          <p className="text-xs text-slate-500 mt-0.5">
            Cơ sở: <MapPin className="w-3 h-3 text-brand-600 inline" /> {facility.name} — Ô kho số <strong>{finalUnitNumber}</strong>
          </p>
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
                      {targetUnit ? `Tầng ${targetUnit.floor} · ${targetUnit.zone}` : 'Sẵn sàng nhận kho'}
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

              {/* Quick switch button to Floorplan */}
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-slate-600">Bạn muốn đổi vị trí ô khác trên mặt bằng?</span>
                <Link
                  to={`/customer/units?facility=${facility.id}&type=${unitType.id}`}
                  className="font-bold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  Mở sơ đồ mặt bằng <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Duration Options (BR-GEN-03) */}
              <div className="pt-2 space-y-2.5">
                <label className="block text-sm font-semibold text-[#0a1614]">
                  Chọn gói thời hạn thuê (BR-GEN-03):
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
                  <p>• <strong>BR-CAN-01</strong>: Khách được hủy đặt chỗ và hoàn cọc 100% nếu thông báo trước 24 giờ kể từ ngày bắt đầu thuê.</p>
                  <p>• <strong>BR-RET-06</strong>: Khách trả kho trước hạn hợp đồng không được hoàn lại tiền thuê các tháng còn lại.</p>
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
                className="px-6 py-2.5 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-xs"
              >
                <span>Tiếp tục: Thanh toán VietQR & Giữ chỗ 48h</span>
                <ArrowRight className="w-4 h-4" />
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
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chuyển khoản chính xác số tiền và nội dung bên dưới. Hệ thống sẽ tự động đối soát và kích hoạt mã PIN nhận kho.
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] text-slate-400 block">Thời gian giữ chỗ còn lại:</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7c94c3] bg-[#7c94c3]/10 px-2.5 py-1 rounded-lg mt-0.5 font-mono tabular-nums">
                    <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                    {formattedCountdown}
                  </span>
                </div>
              </div>

              {/* QR Code & Banking details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* QR Display */}
                <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=vietqr://${calculation.totalDueToday}/${transferContent}`}
                      alt="VietQR Code"
                      className="w-40 h-40 object-contain"
                    />
                    <span className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-brand-600" />
                      VietQR · Napas247
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
                    <strong className="text-sm text-[#0a1614] font-bold">MB Bank (Ngân hàng Quân Đội)</strong>
                  </div>

                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Số tài khoản:</span>
                      <strong className="text-sm text-[#0a1614] font-bold tracking-wider">0888 567 999</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy('0888567999')}
                      className="p-1.5 text-slate-400 hover:text-brand-600 rounded cursor-pointer"
                      title="Sao chép số tài khoản"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#f2f9f7] p-3 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">Chủ tài khoản:</span>
                    <strong className="text-sm text-[#0a1614] font-bold uppercase">CONG TY CP SMARTSTORAGE VIET NAM</strong>
                  </div>

                  <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-amber-800 font-semibold block">Nội dung chuyển khoản (Bắt buộc):</span>
                      <strong className="text-sm text-amber-950 font-bold tracking-wider">{transferContent}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(transferContent)}
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
