import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  CreditCard,
  Landmark,
  ExternalLink,
  Zap
} from 'lucide-react';
import { formatVND } from '../utils/pricing';
import type { CheckoutResponse } from '../api/customerApi';
import { vnpayPayHref } from './VnpayPayLinks';
import { apiClient } from '@/api/client';
import type { Facility, UnitType } from '../types';

export interface BookingPaymentStepProps {
  createdReservationId: number | null;
  checkoutData: CheckoutResponse | null;
  calculation: any;
  formattedCountdown: string;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldKey: string) => void;
  paymentNotice: string | null;
  paymentStatus: 'IDLE' | 'PENDING' | 'SUCCESS' | 'EXPIRED';
  redirectCountdown: number;
  onCancelReservation?: () => void;
  setShowCancelModal?: (show: boolean) => void;
  isVerifying: boolean;
  handleCheckPaymentStatus: () => void;
  facility: Facility;
  unitType: UnitType;
  finalUnitNumber: string;
  durationMonths: number;
  depositMultiplierLabel: string;
  hasExtendedInsurance?: boolean;
  insuranceTotal?: number;
}

/**
 * BookingPaymentStep — Bước 3: Thanh toán VNPay & Đếm ngược giữ chỗ 48h (BR-RES-02)
 * Chuẩn UX Fintech hiện đại: Chọn phương thức -> Thanh toán ngay với VNPay (Polling tự động ngầm)
 */
export const BookingPaymentStep: React.FC<BookingPaymentStepProps> = ({
  createdReservationId,
  checkoutData,
  calculation,
  formattedCountdown,
  paymentNotice,
  paymentStatus,
  redirectCountdown,
  onCancelReservation,
  setShowCancelModal,
  isVerifying,
  handleCheckPaymentStatus,
  facility,
  unitType,
  finalUnitNumber,
  durationMonths,
  depositMultiplierLabel,
  hasExtendedInsurance = false,
  insuranceTotal = 0,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'VNBANK' | 'INTCARD'>('VNBANK');
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [isMocking, setIsMocking] = useState<boolean>(false);
  const [mockError, setMockError] = useState<string | null>(null);

  const isSuccess = paymentStatus === 'SUCCESS';
  const orderDescription = checkoutData?.description || `DH${createdReservationId}`;
  const rawTotal = checkoutData?.amount || calculation?.totalDueToday || 0;
  const totalAmount = rawTotal + (checkoutData?.amount ? 0 : (hasExtendedInsurance ? insuranceTotal : 0));

  const handleProceedToPayment = () => {
    if (!checkoutData?.orderCode) return;
    setIsRedirecting(true);
    window.location.href = vnpayPayHref(checkoutData.orderCode, selectedMethod);
  };

  const handleMockPay = async () => {
    if (!checkoutData?.orderCode) return;
    try {
      setMockError(null);
      setIsMocking(true);
      await apiClient<any>(`/payments/vnpay/mock-complete/${checkoutData.orderCode}`, {
        method: 'POST',
      });
      // Kích hoạt kiểm tra trạng thái để UI chuyển sang SUCCESS tức thì
      handleCheckPaymentStatus();
    } catch (err: any) {
      setMockError(err?.message || 'Lỗi khi giả lập thanh toán');
    } finally {
      setIsMocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== 1. MAIN WORKSPACE ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================== CỘT TRÁI (8 COLS) ==================== */}
        <div className="lg:col-span-8 space-y-5">
          {/* NOTICE ALERT NẾU CÓ LỖI */}
          {paymentNotice && !isSuccess && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{paymentNotice}</span>
            </div>
          )}

          {/* ==================== PHA THÀNH CÔNG (SUCCESS CARD) ==================== */}
          {isSuccess ? (
            <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 shadow-md text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  Giao dịch đã được xác nhận tức thì
                </span>
                <h3 className="text-2xl font-black text-[#0a1614]">Thanh Toán Giữ Chỗ Thành Công!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Hệ thống đã tự động cấp <strong>Vé Check-in QR</strong> và kích hoạt hợp đồng tại chi nhánh <strong>{facility.name}</strong>.
                </p>
              </div>

              {/* CARD TÓM TẮT XÁC NHẬN */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 max-w-md mx-auto text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã đơn đặt chỗ:</span>
                  <span className="font-mono font-bold text-slate-900">{orderDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hạng kho đã đặt:</span>
                  <span className="font-mono font-bold text-brand-700">{unitType.name || finalUnitNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền đã chuyển:</span>
                  <span className="font-bold text-emerald-700">{formatVND(totalAmount)}</span>
                </div>
              </div>

              {/* COUNTDOWN REDIRECT */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCheckPaymentStatus}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <span>Xem Chi Tiết Ô Kho Tại My Units ({redirectCountdown}s)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* ==================== PHA CHỜ THANH TOÁN ==================== */
            <div className="space-y-5">
              {/* BANNER THÔNG TIN ĐƠN GIỮ CHỖ & ĐẾM NGƯỢC */}
              <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border bg-brand-50 text-brand-700 border-brand-200">
                        Đơn Giữ Chỗ Đang Chờ Thanh Toán
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        Mã: <strong className="text-[#0a1614]">{orderDescription}</strong>
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#0a1614] mt-1">
                      Thanh toán VNPay
                    </h2>
                  </div>
                </div>

                {/* BỘ ĐẾM LÙI THỜI GIAN GIỮ Ô KHO */}
                <div className="flex items-center gap-3 bg-brand-50/80 border border-brand-200/90 px-4 py-2.5 rounded-xl shrink-0">
                  <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
                  <div className="text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Thời gian giữ ô kho</div>
                    <div className="text-base font-black text-brand-700 num tracking-tight">[{formattedCountdown}]</div>
                  </div>
                </div>
              </div>

              {/* CARD CHỌN PHƯƠNG THỨC THANH TOÁN */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Chọn phương thức thanh toán
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Cổng thanh toán VNPay
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Lựa chọn 1: Thẻ ATM / Tài khoản Nội địa */}
                  <label
                    onClick={() => setSelectedMethod('VNBANK')}
                    className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
                      selectedMethod === 'VNBANK'
                        ? 'bg-white border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 w-full">
                      <input
                        type="radio"
                        name="payment_method"
                        value="VNBANK"
                        checked={selectedMethod === 'VNBANK'}
                        onChange={() => setSelectedMethod('VNBANK')}
                        className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-900 flex items-center gap-2">
                          Thẻ ATM / Tài khoản Nội địa 
                          <span className="bg-brand-100 text-brand-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                            Khuyên dùng
                          </span>
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          Hỗ trợ 40+ ngân hàng tại Việt Nam (Vietcombank, MB, Techcombank, ...)
                        </span>
                      </div>
                      <CreditCard className="w-5 h-5 text-slate-400 shrink-0" />
                    </div>
                  </label>

                  {/* Lựa chọn 2: Thẻ Quốc tế */}
                  <label
                    onClick={() => setSelectedMethod('INTCARD')}
                    className={`relative flex cursor-pointer rounded-xl border p-4 shadow-xs transition-all ${
                      selectedMethod === 'INTCARD'
                        ? 'bg-white border-brand-500 ring-2 ring-brand-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 w-full">
                      <input
                        type="radio"
                        name="payment_method"
                        value="INTCARD"
                        checked={selectedMethod === 'INTCARD'}
                        onChange={() => setSelectedMethod('INTCARD')}
                        className="h-4 w-4 text-brand-600 border-slate-300 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-slate-900">
                          Thẻ Quốc tế (Visa / Mastercard / JCB)
                        </span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          Thanh toán bằng thẻ tín dụng hoặc ghi nợ quốc tế phát hành toàn cầu
                        </span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                  </label>
                </div>

                {/* THÔNG BÁO BẢO MẬT & HỦY GIỮ CHỖ */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => (onCancelReservation ? onCancelReservation() : setShowCancelModal?.(true))}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1"
                  >
                    <span>✕ Hủy giữ chỗ</span>
                  </button>

                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>
                      {isVerifying ? 'Đang đối soát giao dịch ngầm...' : 'Hệ thống tự động kích hoạt sau khi hoàn tất thanh toán'}
                    </span>
                  </div>
                </div>

                {/* CÔNG CỤ DÀNH CHO DEV/TESTER (CHỈ HIỂN THỊ Ở MÔI TRƯỜNG DEV) */}
                {import.meta.env.DEV && (
                  <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                    <p className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                      <span>⚙️ CÔNG CỤ DÀNH CHO DEV/TESTER:</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleMockPay}
                        disabled={isMocking || !checkoutData?.orderCode}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>{isMocking ? 'Đang xử lý...' : 'Giả lập thanh toán thành công'}</span>
                      </button>
                    </div>
                    {mockError && (
                      <p className="text-[11px] text-rose-600 font-medium">{mockError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ==================== CỘT PHẢI: HÓA ĐƠN ĐẶT CHỖ (4 COLS) ==================== */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs sticky top-24 space-y-4">
            {/* Invoice Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                Hóa đơn đặt chỗ
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200/60">
                Đã chọn ô
              </span>
            </div>

            {/* Thông tin định danh cơ bản */}
            <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0 text-slate-500 font-medium">Cơ sở:</span>
                <span className="text-slate-900 text-right font-bold truncate max-w-[190px]">
                  {facility.name}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0 text-slate-500 font-medium">Hạng kho:</span>
                <span className="text-slate-900 text-right font-bold truncate max-w-[190px]">
                  {unitType.name || finalUnitNumber}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0 text-slate-500 font-medium">Quy cách:</span>
                <span className="text-slate-900 text-right font-medium">
                  Size {unitType.sizeCategory || 'S'}{unitType.dimensions ? ` (${unitType.dimensions})` : unitType.areaM2 ? ` (${unitType.areaM2} m²)` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0 text-slate-500 font-medium">Kỳ thuê:</span>
                <span className="text-slate-900 text-right font-medium">
                  {durationMonths} tháng
                </span>
              </div>
            </div>

            {/* Bảng tính toán tiền thuê và tiền cọc */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền thuê ({durationMonths} tháng):</span>
                <span className="font-semibold text-slate-900 num">
                  {formatVND(calculation.rentalFee)}
                </span>
              </div>

              {calculation.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                  <span>
                    {calculation.discountProgramName
                      ? `${calculation.discountProgramName}${
                          calculation.discountPercent > 0 && !calculation.discountProgramName.includes('%')
                            ? ` (-${calculation.discountPercent}%)`
                            : ''
                        }:`
                      : `Chiết khấu (-${calculation.discountPercent}%):`}
                  </span>
                  <span className="num text-emerald-800 font-black">
                    -{formatVND(calculation.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Tiền đặt cọc ({depositMultiplierLabel} tháng):</span>
                <span className="font-semibold text-slate-900 num">
                  {formatVND(calculation.depositAmount)}
                </span>
              </div>

              {hasExtendedInsurance && insuranceTotal > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200/60">
                  <span>Gói bảo vệ toàn diện 50M ({durationMonths} tháng):</span>
                  <span className="num text-emerald-800 font-black">
                    +{formatVND(insuranceTotal)}
                  </span>
                </div>
              )}
            </div>

            {/* Tổng thanh toán & Nút hành động chính */}
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Tổng thanh toán:
                </span>
                <span className="text-xl font-bold text-brand-600 num tracking-tight tabular-nums">
                  {formatVND(totalAmount)}
                </span>
              </div>

              {/* Nút hành động chính: Thanh toán ngay với VNPay */}
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={isRedirecting || !checkoutData?.orderCode}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang chuyển hướng sang VNPay...</span>
                  </>
                ) : (
                  <>
                    <span>Thanh toán ngay với VNPay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Giao dịch được mã hóa an toàn bởi VNPay</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
