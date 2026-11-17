import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Minus,
  Plus,
  Tag,
  Check,
  Building2,
  Box,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  XCircle,
  PlusCircle,
  RotateCcw,
  Landmark,
  CreditCard,
} from 'lucide-react';
import { getCustomerContracts } from '@/api/customerRentals';
import { formatVND } from '../utils/pricing';
import type { RentedContract } from '../types';
import { RenewalExpiryBanner } from '../components/RenewalExpiryBanner';
import { vnpayPayHref } from '../components/VnpayPayLinks';
import { RenewalReceiptModal } from '../components/RenewalReceiptModal';
import { ScheduleReturnModal } from '../components/ScheduleReturnModal';
import { tokenStorage } from '@/utils/tokenStorage';
import { useActivePolicy } from '@/hooks/useActivePolicy';
import { customerApi } from '../api/customerApi';
import { calculateDaysRemaining } from '../utils/renewalPricing';
import { clampRenewalMonths, discountTag, termMonthChoices } from '../utils/policyTerms';
import { useRenewalPricing } from '../hooks/useRenewalPricing';
import { useRenewalPayment } from '../hooks/useRenewalPayment';

export const RenewalPage: React.FC = () => {
  const policy = useActivePolicy();
  const holdHours = policy?.reservationHoldHours ?? 0;
  const termMonths = useMemo(
    () => (policy ? termMonthChoices(policy.renewalMinMonths, policy.renewalMaxMonths) : []),
    [policy],
  );
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlStep = searchParams.get('step');
  const urlOrderCode = searchParams.get('orderCode');

  // Auth Guard: Mục 2 — Yêu cầu đăng nhập trước khi gia hạn hợp đồng
  useEffect(() => {
    if (!tokenStorage.getAccessToken()) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`, { replace: true });
    }
  }, [navigate]);

  const [contract, setContract] = useState<RentedContract | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    return urlStep === '3' ? 3 : 1;
  });
  const [renewalMonths, setRenewalMonths] = useState<number>(3);
  const [selectedBankCode, setSelectedBankCode] = useState<'VNBANK' | 'INTCARD'>('VNBANK');
  const [isRedirectingVnpay, setIsRedirectingVnpay] = useState<boolean>(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    if (!policy) return;
    setRenewalMonths((current) =>
      clampRenewalMonths(current, policy.renewalMinMonths, policy.renewalMaxMonths)
    );
  }, [policy]);

  // Tải thông tin hợp đồng thực tế từ customerRentals API (gồm cả localStorage overrides)
  useEffect(() => {
    let isMounted = true;
    getCustomerContracts()
      .then((contracts) => {
        if (!isMounted) return;
        const found = contracts.find((c) => c.id === contractId) || null;
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

  // Khối tính giá & báo giá gia hạn (fetch quote, conflict, pricing) — BR-REN-03/06/07/04
  const {
    loadingQuote,
    isCapacityConflict,
    setCapacityConflict,
    isUnitTypeInactive,
    unitTypeInactiveMessage,
    isPastDeadlineFromBackend,
    deadlineMessage,
    newEndDate,
    pricing,
  } = useRenewalPricing({ contract, renewalMonths });

  // Khối thanh toán VNPay Sandbox (checkout, polling, countdown, sandbox, hủy lệnh, E-Receipt) — BR-REN-04/05
  const payment = useRenewalPayment({
    contract,
    currentStep,
    renewalMonths,
    holdHours,
    urlOrderCode,
    onCapacityConflict: setCapacityConflict,
    onRenewalApplied: setContract,
    onRequestStepReset: () => {
      setCurrentStep(1);
      navigate(`/customer/renew/${contractId}`, { replace: true });
    },
  });

  const {
    checkoutData,
    isLoadingCheckout,
    checkoutError,
    isPaidSuccess,
    paymentNotice,
    setPaymentNotice,
    isCancelling,
    showCancelDialog,
    setShowCancelDialog,
    countdownSeconds,
    formatCountdown,
    isProcessing,
    renewalResult,
    confirmedRenewal,
    showReceiptModal,
    setShowReceiptModal,
    handleCancelPayment,
  } = payment;

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

  const isTerminated = contract ? (contract.status === 'TERMINATED' || contract.status === 'CLOSED') : false;
  const isPendingReturn = contract ? contract.status === 'PENDING_RETURN' : false;
  const isOverdue = contract ? contract.status === 'OVERDUE' : false;
  const daysRemaining = contract?.endDate ? calculateDaysRemaining(contract.endDate) : 999;
  const isPastRenewalDeadline = (contract?.status === 'ACTIVE' && daysRemaining < 20) || isPastDeadlineFromBackend;
  const isRenewalBlocked = isTerminated || isPendingReturn || isOverdue || isCapacityConflict || isPastRenewalDeadline || isUnitTypeInactive;

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
        <h1 className="text-xl sm:text-2xl font-black text-[#0a1614] tracking-tight">
          Gia Hạn Hợp Đồng Thuê Kho
        </h1>
      </div>

      {isOverdue && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 text-rose-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs flex-1">
            <h4 className="font-bold text-sm text-rose-950">
              Hợp đồng đã quá hạn — Khóa tự gia hạn trực tuyến (Quy chế BR-REN-06)
            </h4>
            <p className="leading-relaxed text-rose-800">
              Hợp đồng của Quý khách đã quá hạn ngày kết thúc (máy trạng thái một chiều). Theo quy định, hợp đồng quá hạn không được phép gia hạn tiếp. Quý khách vui lòng thanh toán phí quá hạn để nhận mã PIN tạm thời dọn dẹp tài sản và thực hiện thủ tục Báo trả kho.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReturnModal(true)}
                className="text-xs font-bold border-rose-300 text-rose-800 hover:bg-rose-100"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Lên lịch trả kho
              </Button>
            </div>
          </div>
        </div>
      )}

      {isUnitTypeInactive && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-rose-900 shadow-xs">
          <div className="flex items-start gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm text-rose-950">
                Loại ô kho đã ngừng kinh doanh (Graceful Deactivation)
              </h4>
              <p className="leading-relaxed text-rose-800">
                {unitTypeInactiveMessage || 'Loại kho này đã ngừng kinh doanh, vui lòng liên hệ ban quản lý.'} Hợp đồng hiện tại của Quý khách vẫn được duy trì bình thường đến hết hạn ({contract.endDate}), nhưng không thể tự gia hạn kỳ mới.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              to={contract.facilityId ? `/booking/picker?facilityId=${contract.facilityId}` : '/booking/picker'}
            >
              <Button variant="primary" size="sm" className="text-xs font-bold flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tìm ô kho mới</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReturnModal(true)}
              className="text-xs font-bold flex items-center gap-1.5 border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Lên lịch trả kho</span>
            </Button>
          </div>
        </div>
      )}

      {isPastRenewalDeadline && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs flex-1">
            <h4 className="font-bold text-sm text-amber-950">
              {deadlineMessage || 'Đã quá thời hạn tự gia hạn Online (trước 20 ngày theo quy chế BR-REN-01)'}
            </h4>
            <p className="leading-relaxed text-amber-800">
              Hợp đồng của bạn đã bước vào giai đoạn chốt kế hoạch giải phóng ô kho hoặc ưu tiên cho Danh sách chờ (Waitlist). Nút tự gia hạn Online đã tạm thời bị khóa. Quý khách vui lòng liên hệ trực tiếp Quản lý cơ sở để được kiểm tra dung lượng thực tế và xem xét hỗ trợ gia hạn ngoại lệ!
            </p>
            <div className="pt-1">
              <span>Hotline Quản lý cơ sở: </span>
              <a href="tel:19002026" className="font-bold text-brand-700 underline">
                1900-2026
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 3-Step Indicator Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs flex items-center justify-between text-xs sm:text-sm">
        <div
          onClick={() => {
            if (currentStep === 3) return;
            if (!isRenewalBlocked) setCurrentStep(1);
          }}
          title={currentStep === 3 ? "Không thể chuyển bước khi đang chờ thanh toán VNPay. Vui lòng chọn 'Hủy lệnh thanh toán' nếu muốn đổi thông tin." : undefined}
          className={`flex items-center gap-2 transition-all ${
            currentStep === 3
              ? 'cursor-not-allowed select-none'
              : !isRenewalBlocked
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-60'
          } ${
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
          <span>Chọn kỳ hạn & Kiểm tra</span>
        </div>

        <div className="h-px bg-slate-200 flex-1 mx-3 hidden sm:block" />

        <div
          onClick={() => {
            if (currentStep === 3) return;
            if (!isRenewalBlocked) setCurrentStep(2);
          }}
          title={currentStep === 3 ? "Không thể chuyển bước khi đang chờ thanh toán VNPay. Vui lòng chọn 'Hủy lệnh thanh toán' nếu muốn đổi thông tin." : undefined}
          className={`flex items-center gap-2 transition-all ${
            currentStep === 3
              ? 'cursor-not-allowed select-none'
              : !isRenewalBlocked
                ? 'cursor-pointer'
                : 'cursor-not-allowed opacity-60'
          } ${
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
          <span>Bảng kê tài chính</span>
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
          <span>Thanh toán VNPay</span>
        </div>
      </div>

      {/* Dynamic Expiry & Eligibility Banner (Ẩn ở Bước 3 khi khách đã sang màn hình thanh toán) */}
      {currentStep !== 3 && <RenewalExpiryBanner contract={contract} />}

      {/* MÀN HÌNH CẢNH BÁO XUNG ĐỘT TRÙNG LỊCH ĐẶT TRƯỚC (Availability Conflict) */}
      {isCapacityConflict ? (
        <Card className="p-8 sm:p-12 text-center bg-white border border-amber-300 rounded-2xl shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border-2 border-amber-200">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full uppercase tracking-wider">
              Xung đột lịch đặt trước
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0a1614]">
              Ô kho {contract.unitNumber} đã có người đặt trước cho kỳ tiếp theo
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Rất tiếc, khoảng thời gian tiếp theo của ô kho này đã được một khách hàng khác đặt chỗ trước. Bạn không thể tiếp tục gia hạn trên ô kho này.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <Link
              to={contract.facilityId ? `/booking/picker?facilityId=${contract.facilityId}` : '/booking/picker'}
              className="w-full sm:w-auto"
            >
              <Button
                variant="primary"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 shadow-xs font-bold text-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tìm & Thuê ô kho mới tại cơ sở này</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              onClick={() => setShowReturnModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-slate-700 hover:text-amber-800 hover:bg-amber-50 border-slate-300 font-bold text-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Lên lịch nghiệm thu & Trả kho</span>
            </Button>
          </div>
        </Card>
      ) : (
        <>
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
                    {contract.status === 'OVERDUE' && (
                      <Badge variant="overdue" className="text-[10px] px-2 py-0.5">
                        Quá hạn
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-[#0a1614] flex items-center gap-2">
                    <Box className="w-4 h-4 text-brand-600" />
                    Ô kho {contract.unitNumber} · {contract.unitTypeName.split('–')[0].trim()}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {contract.facilityName}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Giá hợp đồng hiện tại</span>
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
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-emerald-800 font-medium block">Ngày kết thúc mới sau gia hạn:</span>
                  <span className="text-sm font-extrabold text-emerald-700 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {newEndDate}
                  </span>
                </div>
              </div>

              {/* Renewal Duration Selector (BR-REN-03 & BR-REN-07) */}
              <div className="pt-4 border-t border-gray-100 space-y-5">
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">
                        Chọn kỳ hạn muốn gia hạn thêm:
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Kỳ hạn từ {policy?.renewalMinMonths ?? '…'} đến {policy?.renewalMaxMonths ?? '…'} tháng
                      </p>
                    </div>
                  </div>

                  <div
                    className={`grid gap-3 pt-2 ${
                      termMonths.length === 3
                        ? 'grid-cols-3'
                        : termMonths.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-2 sm:grid-cols-4'
                    }`}
                  >
                    {termMonths.map((months) => {
                      const tag = discountTag(months, 'reduce');
                      const badgeLabel = tag || (months === 3 ? 'Phổ biến' : null);
                      const isSelected = renewalMonths === months;
                      return (
                        <button
                          key={months}
                          type="button"
                          disabled={isRenewalBlocked}
                          onClick={() => setRenewalMonths(months)}
                          className={`relative flex items-center justify-center py-3 px-4 rounded-lg text-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                            isRenewalBlocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            isSelected
                              ? 'border-2 border-brand-500 bg-brand-50/50 text-brand-700'
                              : 'border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {badgeLabel && (
                            <span
                              className={`absolute -top-2.5 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full border shadow-xs uppercase tracking-wide whitespace-nowrap ${
                                tag
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-100 text-amber-700 border-amber-200'
                              }`}
                            >
                              {badgeLabel}
                            </span>
                          )}
                          <span className={`font-bold text-sm ${isSelected ? 'text-brand-700' : 'text-gray-700'}`}>
                            {months} Tháng
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ô nhập số tháng tùy chỉnh dạng Input Group liền mạch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hoặc nhập số tháng tùy chỉnh:
                  </label>
                  <div className="inline-flex items-center w-52 border border-gray-300 rounded-lg overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 bg-white">
                    <button
                      type="button"
                      disabled={isRenewalBlocked || renewalMonths <= (policy?.renewalMinMonths ?? 1)}
                      onClick={() =>
                        setRenewalMonths((current) =>
                          clampRenewalMonths(current - 1, policy?.renewalMinMonths, policy?.renewalMaxMonths)
                        )
                      }
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-r border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Giảm 1 tháng"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={policy?.renewalMinMonths ?? 1}
                      max={policy?.renewalMaxMonths ?? 12}
                      value={renewalMonths}
                      disabled={isRenewalBlocked}
                      onChange={(event) =>
                        setRenewalMonths(
                          clampRenewalMonths(
                            Number(event.target.value),
                            policy?.renewalMinMonths,
                            policy?.renewalMaxMonths
                          )
                        )
                      }
                      className="w-full text-center border-none focus:outline-none focus:ring-0 text-gray-900 font-bold tabular-nums py-2 px-1 bg-transparent disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label="Số tháng gia hạn"
                    />
                    <button
                      type="button"
                      disabled={isRenewalBlocked || renewalMonths >= (policy?.renewalMaxMonths ?? 12)}
                      onClick={() =>
                        setRenewalMonths((current) =>
                          clampRenewalMonths(current + 1, policy?.renewalMinMonths, policy?.renewalMaxMonths)
                        )
                      }
                      className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-l border-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      aria-label="Tăng 1 tháng"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-2 bg-gray-50 text-gray-600 font-medium border-l border-gray-300 text-sm shrink-0">
                      Tháng
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Cọc {formatVND(contract.depositHeld)} được giữ nguyên. Ô {contract.unitNumber} và mã PIN mở cửa không đổi.
              </p>
            </Card>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                onClick={async () => {
                  if (contract?.hasPendingRenewal && contract?.pendingRenewalOrderCode) {
                    try {
                      await customerApi.cancelPaymentOrder(contract.pendingRenewalOrderCode);
                    } catch {
                      // ignore
                    }
                  }
                  navigate('/customer/my-units');
                }}
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                disabled={isRenewalBlocked}
                onClick={() => !isRenewalBlocked && setCurrentStep(2)}
                className={`px-6 py-2.5 flex items-center gap-2 shadow-xs ${
                  isRenewalBlocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>{isRenewalBlocked ? 'Đã khóa gia hạn' : 'Xem Bảng Kê Chi Phí & Tiếp Tục'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Summary Card Right (1/3) */}
          <div className="lg:col-span-1">
            <Card className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 sticky top-24">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#0a1614]">
                    Tóm Tắt Gia Hạn
                  </h3>
                </div>
                {loadingQuote && (
                  <span className="text-[11px] text-brand-600 font-medium animate-pulse">
                    Đang tính giá...
                  </span>
                )}
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Giá niêm yết áp dụng mới:</span>
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
                    <span>Phí quá hạn gộp:</span>
                    <span>+{formatVND(pricing.overdueFee)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Cọc phát sinh:</span>
                  <span className="font-bold text-emerald-600">0 ₫</span>
                </div>

                <div className="pt-3 border-t-2 border-slate-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-[#0a1614] block">Tổng thanh toán:</span>
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
                    <strong className="text-slate-800 block">Tiền thuê ô kho {contract.unitNumber}</strong>
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
                        Chính sách ưu đãi gia hạn dài hạn
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

                {/* Dòng 3: Khoản nợ quá hạn gộp vào */}
                {pricing.overdueFee > 0 && (
                  <div className="px-4 py-3.5 grid grid-cols-12 gap-2 items-center bg-rose-50/40">
                    <div className="col-span-6 sm:col-span-7">
                      <strong className="text-rose-900 block flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Khoản nợ quá hạn & Phí phạt chậm trả gộp
                      </strong>
                      <span className="text-xs text-rose-800">
                        Tự động gộp để giải tỏa trạng thái khóa ô kho và kích hoạt lại mã PIN
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
                      Tiền cọc bảo đảm phát sinh
                    </strong>
                    <span className="text-xs text-emerald-800">
                      Bảo lưu 100% tiền cọc cũ ({formatVND(contract.depositHeld)})
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
                <span className="text-sm sm:text-base font-extrabold text-[#0a1614] block">
                  Tổng số tiền thanh toán thực tế:
                </span>
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
                disabled={isRenewalBlocked}
                onClick={() => !isRenewalBlocked && setCurrentStep(3)}
                className={`px-6 py-2.5 flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs ${
                  isRenewalBlocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <span>{isRenewalBlocked ? 'Gia hạn bị khóa' : 'Tiến Hành Thanh Toán VNPay'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: THANH TOÁN VNPAY SANDBOX & TỰ ĐỘNG GIA HẠN */}
      {currentStep === 3 && (
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-5">
            {/* Header payment */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-[#0a1614]">
                  Thanh toán VNPay để hoàn tất gia hạn
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gia hạn hợp đồng #{contract.contractNumber} thêm {renewalMonths} tháng
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Hiệu lực phiên giao dịch:</span>
                <span className="num text-xs text-amber-900 font-extrabold tracking-wider bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300/60 shadow-2xs">
                  {formatCountdown(countdownSeconds)}
                </span>
              </div>
            </div>

            {/* Trạng thái thành công tự động khi webhook bắn về */}
            {isPaidSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Thanh toán thành công. Hệ thống đang kích hoạt hợp đồng gia hạn...</span>
              </div>
            )}

            {/* Trạng thái tải checkout */}
            {isLoadingCheckout ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                <p className="text-sm text-slate-600 font-medium">Đang tạo mã thanh toán...</p>
              </div>
            ) : (
              <>
                {checkoutError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Chọn phương thức thanh toán VNPay dạng thẻ phẳng (Không lộ công cụ Dev/Test) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Chọn phương thức thanh toán qua VNPay
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label
                      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedBankCode === 'VNBANK'
                          ? 'border-2 border-brand-500 bg-brand-50/30 shadow-2xs'
                          : 'border-gray-200 bg-white hover:border-brand-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="renewal-vnpay-method"
                        value="VNBANK"
                        checked={selectedBankCode === 'VNBANK'}
                        onChange={() => setSelectedBankCode('VNBANK')}
                        className="mt-1 h-4 w-4 accent-brand-600 cursor-pointer"
                      />
                      <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">Thẻ ATM / Tài khoản nội địa</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                            Khuyên dùng
                          </span>
                        </div>
                        <span className="block text-xs text-gray-500 mt-1">
                          Hỗ trợ 40+ ngân hàng nội địa Việt Nam
                        </span>
                      </div>
                    </label>

                    <label
                      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedBankCode === 'INTCARD'
                          ? 'border-2 border-brand-500 bg-brand-50/30 shadow-2xs'
                          : 'border-gray-200 bg-white hover:border-brand-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="renewal-vnpay-method"
                        value="INTCARD"
                        checked={selectedBankCode === 'INTCARD'}
                        onChange={() => setSelectedBankCode('INTCARD')}
                        className="mt-1 h-4 w-4 accent-brand-600 cursor-pointer"
                      />
                      <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-gray-900">
                          Thẻ Quốc tế (Visa / Master)
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          Thanh toán bằng thẻ tín dụng / ghi nợ quốc tế
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Thông báo đối soát / lỗi */}
                {paymentNotice && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2 shadow-xs">
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

                {/* Tổng tiền & Action buttons */}
                <div className="pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Nút Hủy lệnh thanh toán */}
                  {!showCancelDialog ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      className="w-full sm:w-auto text-gray-600 border-gray-300 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Hủy lệnh thanh toán
                    </Button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <span>Bạn có chắc muốn hủy lệnh thanh toán gia hạn này?</span>
                      <Button size="sm" variant="outline" onClick={() => setShowCancelDialog(false)} className="text-xs py-1 px-2">
                        Không
                      </Button>
                      <Button size="sm" onClick={handleCancelPayment} disabled={isCancelling}
                        className="text-xs py-1 px-2 bg-rose-600 hover:bg-rose-700 text-white">
                        {isCancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-baseline justify-between sm:justify-end gap-2 px-1">
                      <span className="text-xs text-gray-500">Tổng thanh toán:</span>
                      <span className="text-lg font-bold text-brand-700 tabular-nums">
                        {formatVND(pricing.finalTotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isProcessing || isPaidSuccess || isRedirectingVnpay || !checkoutData?.orderCode}
                      onClick={() => {
                        if (!checkoutData?.orderCode) return;
                        setIsRedirectingVnpay(true);
                        window.location.href = vnpayPayHref(checkoutData.orderCode, selectedBankCode);
                      }}
                      className="w-full sm:w-auto px-7 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {isRedirectingVnpay || isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang chuyển hướng sang VNPay...</span>
                        </>
                      ) : isPaidSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Đã thanh toán thành công</span>
                        </>
                      ) : (
                        <>
                          <span>Thanh toán an toàn qua VNPay</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
        </>
      )}

      {/* Schedule Return Modal from Conflict Screen */}
      <ScheduleReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        contract={contract}
        onReturnScheduled={() => {
          setShowReturnModal(false);
          navigate('/customer/my-units');
        }}
      />

      {/* Electronic Renewal Receipt Modal (E-Receipt) */}
      {renewalResult && (
        <RenewalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          contract={renewalResult.contract}
          renewalMonths={confirmedRenewal?.renewalMonths ?? renewalMonths}
          newEndDate={confirmedRenewal?.newEndDate || newEndDate}
          totalPaid={confirmedRenewal?.totalPaid ?? pricing.finalTotal}
          receiptNumber={renewalResult.receiptNumber}
          renewedAt={new Date(renewalResult.renewedAt).toLocaleString('vi-VN')}
          onBackToDashboard={() => navigate('/customer/my-units')}
        />
      )}
    </div>
  );
};
