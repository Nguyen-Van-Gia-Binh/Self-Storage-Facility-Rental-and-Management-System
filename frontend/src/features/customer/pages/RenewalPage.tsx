import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  RefreshCw, 
  ArrowLeft, 
  Sparkles, 
  Copy, 
  QrCode, 
  ArrowRight,
  ShieldCheck, 
  Tag,
  Check,
  Building2,
  Box,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { getCustomerContracts, renewContract } from '@/api/customerRentals';
import { formatVND } from '../utils/pricing';
import type { RentedContract, RenewContractResponse } from '../types';
import { RenewalExpiryBanner } from '../components/RenewalExpiryBanner';
import { RenewalReceiptModal } from '../components/RenewalReceiptModal';

export const RenewalPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<RentedContract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [renewalMonths, setRenewalMonths] = useState<number>(3);
  const [copiedBankInfo, setCopiedBankInfo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [renewalResult, setRenewalResult] = useState<RenewContractResponse | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(900); // 15 phút đếm ngược

  // Tải thông tin hợp đồng thực tế từ customerRentals API (gồm cả localStorage overrides)
  useEffect(() => {
    let isMounted = true;
    getCustomerContracts()
      .then((contracts) => {
        if (!isMounted) return;
        const found = contracts.find((c) => c.id === contractId) || contracts[0] || null;
        setContract(found);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách hợp đồng:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [contractId]);

  // Bộ đếm ngược thời gian thanh toán VietQR (15 phút)
  useEffect(() => {
    if (currentStep !== 3) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  // Format phút:giây đếm ngược
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tính toán ngày kết thúc mới chính xác
  const newEndDate = useMemo(() => {
    if (!contract) return '';
    const currentEnd = new Date(contract.endDate);
    currentEnd.setMonth(currentEnd.getMonth() + renewalMonths);
    return currentEnd.toISOString().split('T')[0];
  }, [contract, renewalMonths]);

  // Tính toán chi phí tài chính minh bạch theo BR-REN-03, BR-REN-06, BR-REN-07 & BR-DEP-01
  const pricing = useMemo(() => {
    if (!contract) {
      return {
        monthlyRent: 0,
        rawRent: 0,
        discountRate: 0,
        discountAmount: 0,
        netRent: 0,
        overdueFee: 0,
        extraDeposit: 0,
        finalTotal: 0,
      };
    }

    const monthlyRent = contract.monthlyRent;
    const rawRent = monthlyRent * renewalMonths;

    // Chính sách ưu đãi chiết khấu (BR-REN-07)
    let discountRate = 0;
    if (renewalMonths >= 12) discountRate = 0.10; // 12 tháng giảm 10%
    else if (renewalMonths >= 6) discountRate = 0.05; // 6-11 tháng giảm 5%

    const discountAmount = Math.round((rawRent * discountRate) / 1000) * 1000;
    const netRent = rawRent - discountAmount;

    // Khoản nợ quá hạn & Phí phạt chậm trả nếu contract OVERDUE (BR-REN-06)
    let overdueFee = 0;
    if (contract.status === 'OVERDUE') {
      overdueFee = contract.overdueFee ?? (contract.overdueDays ? contract.overdueDays * 50000 : 100000);
    }

    // Tiền cọc phát sinh: 0đ theo BR-DEP-01
    const extraDeposit = 0;
    const finalTotal = netRent + overdueFee + extraDeposit;

    return {
      monthlyRent,
      rawRent,
      discountRate,
      discountAmount,
      netRent,
      overdueFee,
      extraDeposit,
      finalTotal,
    };
  }, [contract, renewalMonths]);

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

  // Xác nhận chuyển khoản thành công và kích hoạt gia hạn
  const handleConfirmPayment = async () => {
    if (!contract) return;
    setIsProcessing(true);

    try {
      const res = await renewContract({
        contractId: contract.id,
        months: renewalMonths,
        newEndDate,
        totalAmount: pricing.finalTotal,
        paymentMethod: 'VIETQR',
        transactionReference: `MB-${Date.now().toString().slice(-8)}`,
      });

      setRenewalResult(res);
      setIsProcessing(false);
      setShowReceiptModal(true);
    } catch (err) {
      console.error('Lỗi khi kích hoạt gia hạn:', err);
      setIsProcessing(false);
      alert('Có lỗi xảy ra trong quá trình xử lý gia hạn. Vui lòng thử lại hoặc liên hệ lễ tân.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
        <p className="text-sm font-semibold text-slate-600">
          Đang tải thông tin hợp đồng thuê và kiểm tra điều kiện gia hạn...
        </p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Không tìm thấy hợp đồng</h2>
        <p className="text-sm text-slate-500">
          Không tìm thấy thông tin hợp đồng cần gia hạn trong hệ thống SmartStorage.
        </p>
        <Button variant="primary" onClick={() => navigate('/customer/my-units')}>
          Về danh sách kho của tôi
        </Button>
      </div>
    );
  }

  const isTerminated = contract.status === 'TERMINATED' || contract.status === 'CLOSED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Breadcrumbs & Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <Link
          to="/customer/my-units"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại danh sách kho của tôi</span>
        </Link>
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xs tracking-wider uppercase mb-1">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Gia Hạn Hợp Đồng Trực Tuyến (SmartStorage Self-Service)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0a1614] tracking-tight">
          Gia Hạn Ngăn Kho {contract.unitNumber} · Cơ Sở {contract.facilityName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Gia hạn trực tuyến an toàn theo chuẩn UC-F6-01. Miễn thu thêm cọc (BR-DEP-01), bảo lưu nguyên trạng ngăn tủ và mã PIN liên tục (BR-REN-08).
        </p>
      </div>

      {/* 3-Step Indicator Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center justify-between text-xs sm:text-sm">
        <div 
          onClick={() => !isTerminated && setCurrentStep(1)}
          className={`flex items-center gap-2 cursor-pointer transition-all ${
            currentStep === 1 
              ? 'font-bold text-brand-600' 
              : currentStep > 1 
                ? 'font-semibold text-emerald-600' 
                : 'text-slate-400'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            currentStep === 1 
              ? 'bg-brand-600 text-white font-bold' 
              : currentStep > 1 
                ? 'bg-emerald-100 text-emerald-700 font-bold' 
                : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
          </span>
          <span>1. Chọn kỳ hạn & Kiểm tra</span>
        </div>

        <div className="h-px bg-slate-200 flex-1 mx-3 hidden sm:block" />

        <div 
          onClick={() => !isTerminated && setCurrentStep(2)}
          className={`flex items-center gap-2 cursor-pointer transition-all ${
            currentStep === 2 
              ? 'font-bold text-brand-600' 
              : currentStep > 2 
                ? 'font-semibold text-emerald-600' 
                : 'text-slate-400'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            currentStep === 2 
              ? 'bg-brand-600 text-white font-bold' 
              : currentStep > 2 
                ? 'bg-emerald-100 text-emerald-700 font-bold' 
                : 'bg-slate-100 text-slate-400'
          }`}>
            {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
          </span>
          <span>2. Bảng kê tài chính</span>
        </div>

        <div className="h-px bg-slate-200 flex-1 mx-3 hidden sm:block" />

        <div 
          className={`flex items-center gap-2 transition-all ${
            currentStep === 3 
              ? 'font-bold text-brand-600' 
              : 'text-slate-400'
          }`}
        >
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
            currentStep === 3 
              ? 'bg-brand-600 text-white font-bold' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            3
          </span>
          <span>3. Thanh toán VietQR</span>
        </div>
      </div>

      {/* Dynamic Expiry & Eligibility Banner */}
      <RenewalExpiryBanner contract={contract} />

      {/* STEP 1: CHỌN KỲ HẠN & KIỂM TRA ĐIỀU KIỆN */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Extension Form Left (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full">
                      Hợp đồng #{contract.contractNumber}
                    </span>
                    <Badge variant={contract.status === 'OVERDUE' ? 'overdue' : 'available'} className="text-[10px] px-2 py-0.5">
                      {contract.status === 'OVERDUE' ? 'Quá hạn' : 'Đang hiệu lực'}
                    </Badge>
                  </div>
                  <h2 className="text-base font-bold text-[#0a1614] flex items-center gap-2">
                    <Box className="w-4 h-4 text-brand-600" />
                    Ngăn kho {contract.unitNumber} · {contract.unitTypeName}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {contract.facilityName}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Giá thuê tháng cơ sở</span>
                  <span className="text-base font-extrabold text-brand-600">
                    {formatVND(contract.monthlyRent)}/tháng
                  </span>
                </div>
              </div>

              {/* Timeline comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block">Ngày kết thúc hiện tại:</span>
                  <span className="text-sm font-bold text-slate-800 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {contract.endDate}
                  </span>
                  <span className="text-[11px] text-amber-700">Mốc hết hạn hợp đồng hiện tại</span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-emerald-800 font-medium block">Ngày kết thúc mới sau gia hạn:</span>
                  <span className="text-sm font-extrabold text-emerald-700 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {newEndDate}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    +{renewalMonths} tháng sử dụng liên tục
                  </span>
                </div>
              </div>

              {/* Renewal Duration Selector (BR-REN-03 & BR-REN-07) */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-[#0a1614]">
                    Chọn kỳ hạn muốn gia hạn thêm:
                  </label>
                  <span className="text-xs text-slate-500">Quy định từ 1 đến 12 tháng (BR-REN-03)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { months: 1, label: '1 Tháng', discountTag: null, subtitle: 'Gia hạn linh hoạt' },
                    { months: 3, label: '3 Tháng', discountTag: 'Phổ biến', subtitle: 'Kỳ hạn thông dụng' },
                    { months: 6, label: '6 Tháng', discountTag: 'Giảm 5%', subtitle: 'Ưu đãi nửa năm' },
                    { months: 12, label: '12 Tháng', discountTag: 'Giảm 10%', subtitle: 'Tiết kiệm tối đa' },
                  ].map((pkg) => {
                    const isSelected = renewalMonths === pkg.months;
                    return (
                      <button
                        key={pkg.months}
                        type="button"
                        disabled={isTerminated}
                        onClick={() => setRenewalMonths(pkg.months)}
                        className={`p-3.5 rounded-xl border text-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50/60 shadow-sm ring-2 ring-brand-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${isTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {pkg.discountTag && (
                          <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs ${
                            pkg.months >= 12
                              ? 'bg-rose-600 text-white'
                              : pkg.months >= 6
                                ? 'bg-amber-600 text-white'
                                : 'bg-brand-600 text-white'
                          }`}>
                            {pkg.discountTag}
                          </span>
                        )}
                        <span className={`block font-black text-sm ${isSelected ? 'text-brand-700' : 'text-[#0a1614]'}`}>
                          {pkg.label}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {pkg.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preservation guarantees (BR-DEP-01 & BR-REN-08) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-start gap-2.5 text-xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-emerald-950">Miễn cọc thêm (BR-DEP-01):</strong> Cọc ban đầu <strong>{formatVND(contract.depositHeld)}</strong> tiếp tục được bảo lưu 100%.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-200 flex items-start gap-2.5 text-xs text-slate-700">
                  <Sparkles className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-sky-950">Bảo lưu ngăn kho (BR-REN-08):</strong> Giữ nguyên vị trí ngăn {contract.unitNumber} và mã PIN mở tủ không thay đổi.
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => navigate('/customer/my-units')}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                disabled={isTerminated}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 flex items-center gap-2 shadow-xs"
              >
                <span>Xem Bảng Kê Chi Phí & Tiếp Tục</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Summary Card Right (1/3) */}
          <div className="lg:col-span-1">
            <Card className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 sticky top-24">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#0a1614]">
                  Tóm Tắt Gia Hạn
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kỳ hạn {renewalMonths} tháng cho ngăn {contract.unitNumber}
                </p>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Giá thuê niêm yết:</span>
                  <span className="font-semibold text-slate-800">{formatVND(pricing.monthlyRent)}/tháng</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Kỳ hạn gia hạn:</span>
                  <span className="font-semibold text-slate-800">{renewalMonths} tháng</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tổng tiền thuê:</span>
                  <span className="font-semibold text-slate-800">{formatVND(pricing.rawRent)}</span>
                </div>

                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between items-center text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Chiết khấu ({pricing.discountRate * 100}%):
                    </span>
                    <span>-{formatVND(pricing.discountAmount)}</span>
                  </div>
                )}

                {pricing.overdueFee > 0 && (
                  <div className="flex justify-between items-center text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg text-xs font-bold">
                    <span>Phí quá hạn gộp (BR-REN-06):</span>
                    <span>+{formatVND(pricing.overdueFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Cọc phát sinh:</span>
                  <span className="font-bold text-emerald-600">0 ₫ (BR-DEP-01)</span>
                </div>

                <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-[#0a1614] block">Tổng thanh toán:</span>
                    <span className="text-[11px] text-slate-500">Đến ngày {newEndDate}</span>
                  </div>
                  <span className="text-xl font-black text-brand-600">
                    {formatVND(pricing.finalTotal)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 2: BẢNG KÊ TÀI CHÍNH MINH BẠCH & HÓA ĐƠN NHÁP */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                  Bước 2 / 3
                </span>
                <h2 className="text-xl font-bold text-[#0a1614]">
                  Bảng Kê Chi Phí Gia Hạn Hợp Đồng Chi Tiết
                </h2>
              </div>
              <Badge variant="available" className="text-xs px-2.5 py-1">
                Hóa đơn hợp lệ
              </Badge>
            </div>

            {/* Invoicing Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs sm:text-sm">
              <div className="bg-slate-50 px-4 py-3 font-bold text-slate-700 grid grid-cols-12 gap-2 border-b border-slate-200">
                <span className="col-span-6 sm:col-span-7">Khoản mục chi phí</span>
                <span className="col-span-2 text-center">Đơn vị</span>
                <span className="col-span-4 sm:col-span-3 text-right">Thành tiền (VNĐ)</span>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Dòng 1: Tiền thuê kỳ mới */}
                <div className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 sm:col-span-7">
                    <strong className="text-slate-800 block">Tiền thuê ngăn kho {contract.unitNumber}</strong>
                    <span className="text-xs text-slate-500">
                      Thời hạn {renewalMonths} tháng · Đơn giá {formatVND(pricing.monthlyRent)}/tháng
                    </span>
                  </div>
                  <span className="col-span-2 text-center text-slate-600">{renewalMonths} tháng</span>
                  <span className="col-span-4 sm:col-span-3 text-right font-bold text-slate-900">
                    {formatVND(pricing.rawRent)}
                  </span>
                </div>

                {/* Dòng 2: Chiết khấu dài hạn (nếu có) */}
                {pricing.discountAmount > 0 && (
                  <div className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center bg-amber-50/40">
                    <div className="col-span-6 sm:col-span-7">
                      <strong className="text-amber-900 block flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-amber-600" />
                        Chính sách ưu đãi gia hạn dài hạn (BR-REN-07)
                      </strong>
                      <span className="text-xs text-amber-800">
                        Chiết khấu {pricing.discountRate * 100}% cho hợp đồng từ {renewalMonths >= 12 ? '12' : '6'} tháng
                      </span>
                    </div>
                    <span className="col-span-2 text-center text-amber-900 font-semibold">-{pricing.discountRate * 100}%</span>
                    <span className="col-span-4 sm:col-span-3 text-right font-bold text-amber-700">
                      -{formatVND(pricing.discountAmount)}
                    </span>
                  </div>
                )}

                {/* Dòng 3: Khoản nợ quá hạn gộp vào (BR-REN-06) */}
                {pricing.overdueFee > 0 && (
                  <div className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center bg-rose-50/40">
                    <div className="col-span-6 sm:col-span-7">
                      <strong className="text-rose-900 block flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Khoản nợ quá hạn & Phí phạt chậm trả gộp (BR-REN-06)
                      </strong>
                      <span className="text-xs text-rose-800">
                        Tự động gộp để giải tỏa trạng thái khóa ngăn kho và kích hoạt lại mã PIN
                      </span>
                    </div>
                    <span className="col-span-2 text-center text-rose-900 font-semibold">Gộp nợ</span>
                    <span className="col-span-4 sm:col-span-3 text-right font-bold text-rose-700">
                      +{formatVND(pricing.overdueFee)}
                    </span>
                  </div>
                )}

                {/* Dòng 4: Cọc phát sinh */}
                <div className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center bg-emerald-50/30">
                  <div className="col-span-6 sm:col-span-7">
                    <strong className="text-emerald-950 block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Tiền cọc bảo đảm phát sinh (BR-DEP-01)
                    </strong>
                    <span className="text-xs text-emerald-800">
                      Bảo lưu 100% tiền cọc cũ ({formatVND(contract.depositHeld)}) — Không thu thêm
                    </span>
                  </div>
                  <span className="col-span-2 text-center text-emerald-800 font-semibold">Miễn thu</span>
                  <span className="col-span-4 sm:col-span-3 text-right font-bold text-emerald-700">
                    0 ₫
                  </span>
                </div>
              </div>

              {/* Total Footer */}
              <div className="bg-slate-50/90 p-4 flex items-center justify-between border-t border-slate-200">
                <div>
                  <span className="text-sm sm:text-base font-extrabold text-[#0a1614] block">
                    Tổng số tiền thanh toán thực tế:
                  </span>
                  <span className="text-xs text-slate-500">
                    Thời hạn sử dụng mới kéo dài liên tục đến ngày <strong>{newEndDate}</strong>
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-brand-600">
                  {formatVND(pricing.finalTotal)}
                </span>
              </div>
            </div>

            {/* Action Bar Step 2 */}
            <div className="flex items-center justify-between pt-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Quay lại bước 1
              </Button>
              <Button
                variant="primary"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 flex items-center gap-2 shadow-xs"
              >
                <span>Tiến Hành Thanh Toán VietQR (Napas247)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: THANH TOÁN VIETQR NAPAS247 ĐỘNG & TỰ ĐỘNG GIA HẠN */}
      {currentStep === 3 && (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-6 text-center">
            {/* Countdown Clock Banner */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold mx-auto">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Giao dịch an toàn hết hạn sau:</span>
              <span className="font-mono text-sm text-amber-700">{formatCountdown(countdownSeconds)}</span>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-[#0a1614]">
                Quét Mã VietQR Hoàn Tất Gia Hạn
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Mở ứng dụng Mobile Banking của bất kỳ ngân hàng nào để quét mã QR Napas247 bên dưới. Ngay khi chuyển khoản thành công, hợp đồng sẽ được tự động kích hoạt thêm {renewalMonths} tháng.
              </p>
            </div>

            {/* Dynamic VietQR Display */}
            <div className="flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200 max-w-sm mx-auto shadow-xs">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=vietqr://${pricing.finalTotal}/${transferContent}`}
                  alt="VietQR Code"
                  className="w-48 h-48 object-contain"
                />
                <span className="text-xs font-bold text-slate-700 mt-2.5 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-brand-600" />
                  VietQR · Napas247 Chuẩn Quốc Gia
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-3">
                Số tiền thanh toán: <strong className="text-brand-600 text-base font-black">{formatVND(pricing.finalTotal)}</strong>
              </span>
            </div>

            {/* Banking Details with One-Touch Copy */}
            <div className="space-y-2.5 text-xs text-left max-w-md mx-auto">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block font-medium">Ngân hàng thụ hưởng:</span>
                  <strong className="text-sm text-[#0a1614] font-bold">MB Bank (Ngân hàng Quân Đội)</strong>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  24/7 Miễn phí
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block font-medium">Số tài khoản:</span>
                  <strong className="text-base text-[#0a1614] font-mono font-black">0888 567 999</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('0888567999', 'ACCOUNT')}
                  className="p-2 text-slate-500 hover:text-brand-600 hover:bg-white rounded-lg border border-slate-200 transition-all cursor-pointer"
                  title="Sao chép số tài khoản"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex justify-between items-center">
                <div>
                  <span className="text-amber-800 font-medium block">Nội dung chuyển khoản chuẩn:</span>
                  <strong className="text-sm text-amber-950 font-mono font-black">{transferContent}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(transferContent, 'CONTENT')}
                  className="p-2 text-amber-700 hover:text-amber-900 hover:bg-white/80 rounded-lg border border-amber-300 transition-all cursor-pointer"
                  title="Sao chép nội dung chuyển khoản"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {copiedBankInfo && (
                <div className="text-center text-emerald-600 font-bold text-xs py-1 animate-in fade-in">
                  ✓ Đã sao chép vào bộ nhớ tạm thành công!
                </div>
              )}
            </div>

            {/* Action Confirm Button */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Button
                variant="primary"
                size="lg"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
                className="w-full py-3.5 text-base font-extrabold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang đối soát giao dịch ngân hàng...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Tôi đã hoàn tất chuyển khoản thành công</span>
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="hover:text-slate-800 underline"
                >
                  Quay lại xem bảng kê
                </button>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Xác nhận tự động trong 30 giây
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Electronic Renewal Receipt Modal (E-Receipt) */}
      {renewalResult && (
        <RenewalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          contract={renewalResult.contract}
          renewalMonths={renewalMonths}
          newEndDate={newEndDate}
          totalPaid={pricing.finalTotal}
          receiptNumber={renewalResult.receiptNumber}
          renewedAt={new Date(renewalResult.renewedAt).toLocaleString('vi-VN')}
          onBackToDashboard={() => navigate('/customer/my-units')}
        />
      )}
    </div>
  );
};
