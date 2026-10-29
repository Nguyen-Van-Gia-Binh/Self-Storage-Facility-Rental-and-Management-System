import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  Sparkles,
  QrCode
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatVND } from '../utils/pricing';
import {
  BANK_ACCOUNT_NUMBER,
  BANK_ACCOUNT_NUMBER_PLAIN,
  BANK_NAME,
  ACCOUNT_HOLDER,
  buildVietQrImageUrl,
} from '../utils/paymentBankInfo';
import type { CheckoutResponse } from '../api/customerApi';
import type { Facility, UnitType } from '../types';

export interface BookingPaymentStepProps {
  createdReservationId: number | null;
  checkoutData: CheckoutResponse | null;
  calculation: any;
  formattedCountdown: string;
  copiedField: string | null;
  handleCopyText: (text: string, fieldKey: string) => void;
  paymentNotice: string | null;
  paymentStatus: 'IDLE' | 'PENDING' | 'SUCCESS' | 'EXPIRED';
  redirectCountdown: number;
  isSimulating: boolean;
  holdExpired: boolean;
  handleSimulateTransfer: () => void;
  onCancelReservation?: () => void;
  setShowCancelModal?: (show: boolean) => void;
  isVerifying: boolean;
  handleCheckPaymentStatus: () => void;
  facility: Facility;
  unitType: UnitType;
  finalUnitNumber: string;
  durationMonths: number;
  depositMultiplierLabel: string;
}

/**
 * BookingPaymentStep — Bước 3: Thanh toán VietQR & Đếm ngược giữ chỗ 48h (BR-RES-02)
 * Thiết kế chuẩn SaaS hiện đại: Phân định 3 pha (Quét mã -> Đối soát -> Thành công)
 */
export const BookingPaymentStep: React.FC<BookingPaymentStepProps> = ({
  createdReservationId,
  checkoutData,
  calculation,
  formattedCountdown,
  copiedField,
  handleCopyText,
  paymentNotice,
  paymentStatus,
  redirectCountdown,
  isSimulating,
  holdExpired,
  handleSimulateTransfer,
  onCancelReservation,
  setShowCancelModal,
  isVerifying,
  handleCheckPaymentStatus,
  facility,
  unitType,
  finalUnitNumber,
  durationMonths,
  depositMultiplierLabel,
}) => {
  const isSuccess = paymentStatus === 'SUCCESS';
  const orderDescription = checkoutData?.description || `DH${createdReservationId}`;
  const totalAmount = checkoutData?.amount || calculation?.totalDueToday || 0;

  return (
    <div className="space-y-6">
      {/* ==================== 1. TOP BANNER & COUNTDOWN ==================== */}
      <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-50 text-brand-600 border border-brand-200'
          }`}>
            {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                isSuccess 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-brand-50 text-brand-700 border-brand-200'
              }`}>
                {isSuccess ? 'Đã Thanh Toán Thành Công' : 'Đơn Giữ Chỗ Đang Chờ Thanh Toán'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Mã: <strong className="text-[#0a1614]">{orderDescription}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0a1614] mt-1">
              {isSuccess ? 'Xác Nhận Giữ Chỗ & Bàn Giao Ô Kho' : 'Quét Mã VietQR Chuyển Khoản Nhanh'}
            </h2>
          </div>
        </div>

        {/* BỘ ĐẾM LÙI 48H */}
        {!isSuccess && (
          <div className="flex items-center gap-3 bg-brand-50/80 border border-brand-200/90 px-4 py-2.5 rounded-xl shrink-0">
            <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Thời gian giữ ô kho</div>
              <div className="text-base font-black text-brand-700 font-mono tracking-tight">{formattedCountdown}</div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== 2. MAIN WORKSPACE ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (8 COLS) */}
        <div className="lg:col-span-8 space-y-5">
          {/* NOTICE ALERT NẾU CÓ LỖI */}
          {paymentNotice && !isSuccess && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{paymentNotice}</span>
            </div>
          )}

          {/* ==================== PHA 3: THÀNH CÔNG (SUCCESS CARD) ==================== */}
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
                  <span className="text-slate-500">Ô kho được gán:</span>
                  <span className="font-mono font-bold text-brand-700">{finalUnitNumber}</span>
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
            /* ==================== PHA 1 & 2: QUÉT MÃ VIETQR & ĐỐI SOÁT ==================== */
            <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* TRẠNG THÁI LẮNG NGHE WEBHOOK / ĐỐI SOÁT */}
              <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-xs border ${
                isVerifying 
                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                  : 'bg-brand-50/70 text-[#0a1614] border-brand-200/80'
              }`}>
                <div className="flex items-center gap-2.5 font-semibold">
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
                      <span>Đang đối soát giao dịch với ngân hàng... Vui lòng chờ vài giây</span>
                    </>
                  ) : (
                    <>
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                      </span>
                      <span>Hệ thống tự động lắng nghe Webhook ngân hàng & cấp mã mở kho ngay khi nhận tiền</span>
                    </>
                  )}
                </div>
                {checkoutData?.checkoutUrl && (
                  <a
                    href={checkoutData.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 hover:text-brand-700 font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Mở cổng PayOS</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* KHỐI QR VÀ THÔNG TIN TÀI KHOẢN */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* CỘT QR CODE */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 border border-brand-200/80 rounded-2xl">
                  <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                    {checkoutData?.qrCode ? (
                      <QRCodeSVG value={checkoutData.qrCode} size={165} level="M" includeMargin={true} />
                    ) : (
                      <img
                        src={buildVietQrImageUrl(
                          totalAmount,
                          orderDescription,
                          checkoutData?.accountName || 'SMARTSTORAGE',
                        )}
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
                    <p className="text-[11px] text-slate-500 mt-1.5">Mở App Ngân hàng hoặc ZaloPay để quét</p>
                  </div>
                </div>

                {/* CỘT THÔNG TIN CHUYỂN KHOẢN (COPY 1 CHẠM) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="bg-slate-50/80 border border-brand-200/60 p-3 rounded-xl">
                    <div className="text-[11px] font-semibold text-slate-500">Ngân hàng thụ hưởng</div>
                    <div className="text-xs font-bold text-[#0a1614] mt-0.5">{BANK_NAME}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Chủ tài khoản: <strong className="text-[#0a1614] uppercase">{checkoutData?.accountName || ACCOUNT_HOLDER}</strong>
                    </div>
                  </div>

                  {/* SỐ TÀI KHOẢN */}
                  <div className="flex items-center justify-between bg-white border border-brand-200 p-3 rounded-xl shadow-xs">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Số tài khoản định danh</div>
                      <div className="text-base font-black text-[#0a1614] font-mono mt-0.5">
                        {checkoutData?.accountNumber || BANK_ACCOUNT_NUMBER}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(checkoutData?.accountNumber || BANK_ACCOUNT_NUMBER_PLAIN, 'stk')}
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
                        {formatVND(totalAmount)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(String(totalAmount), 'amount')}
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
                        {orderDescription}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(orderDescription, 'desc')}
                      className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedField === 'desc' ? '✓ Đã chép' : 'Sao chép'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BẢO MẬT & HƯỚNG DẪN */}
              <div className="pt-4 border-t border-brand-100 flex items-start gap-2.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <p><strong>Bảo mật truy cập:</strong> Vé check-in và mã PIN mở cửa điện tử chỉ được sinh ra ngay sau khi ngân hàng đối soát thành công giao dịch của bạn.</p>
              </div>

              {/* NÚT THAO TÁC CHÍNH */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => (onCancelReservation ? onCancelReservation() : setShowCancelModal?.(true))}
                  className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                >
                  ✕ Hủy giữ chỗ
                </button>

                <button
                  type="button"
                  onClick={handleCheckPaymentStatus}
                  disabled={isVerifying}
                  className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra...</span>
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
          )}

          {/* ==================== DEV SANDBOX TESTING BAR (THU GỌN Ở ĐÁY) ==================== */}
          {!isSuccess && (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-3.5 opacity-80 hover:opacity-100 transition-opacity">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs">🧪</span>
                  <div>
                    <div className="text-[11px] font-bold text-slate-700">Sandbox Test Bar (Dành cho Kiểm thử & Demo)</div>
                    <div className="text-[10px] text-slate-500">Giả lập thanh toán tức thì không cần chuyển tiền thật</div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleSimulateTransfer}
                  disabled={isSimulating || holdExpired}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Đang gọi Webhook giả lập...</span>
                    </>
                  ) : (
                    <span>⚡ Giả lập chuyển khoản thành công</span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: TÓM TẮT CHI PHÍ (4 COLS) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs sticky top-24 space-y-3">
            {/* Invoice Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
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
                <span className="shrink-0 text-slate-500 font-medium">Mã ô kho:</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md border font-black text-brand-800 bg-brand-50 border-brand-300">
                    {finalUnitNumber}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="shrink-0 text-slate-500 font-medium">Loại kho:</span>
                <span className="text-slate-900 text-right font-medium">
                  {unitType.name} (Size {unitType.sizeCategory || ''}{unitType.areaM2 ? ` · ${unitType.areaM2} m²` : ''})
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
            <div className="pt-1 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tiền thuê ({durationMonths} tháng):</span>
                <span className="font-semibold text-slate-900 font-mono">
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
                  <span className="font-mono text-emerald-800 font-black">
                    -{formatVND(calculation.discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Tiền đặt cọc ({depositMultiplierLabel} tháng):</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatVND(calculation.depositAmount)}
                </span>
              </div>
            </div>

            {/* Tổng thanh toán */}
            <div className="pt-2.5 border-t border-slate-200">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Tổng thanh toán:
                </span>
                <span className="text-xl font-black text-[#008B74] font-mono tracking-tight">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
