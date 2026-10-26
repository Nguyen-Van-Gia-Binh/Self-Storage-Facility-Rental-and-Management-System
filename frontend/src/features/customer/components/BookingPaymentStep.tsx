import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  ArrowRight 
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
  return (
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
                      src={buildVietQrImageUrl(
                        checkoutData?.amount || calculation?.totalDueToday || 0,
                        checkoutData?.description || `DH${createdReservationId}`,
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
                  <p className="text-[11px] text-slate-500 mt-1.5">Quét bằng Camera / Zalo / App Ngân hàng</p>
                </div>
              </div>

              {/* THÔNG TIN TÀI KHOẢN */}
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
                  <div className="text-xs font-bold text-amber-900">Môi trường Thử nghiệm Thanh toán</div>
                  <div className="text-[11px] text-amber-800/80">Dùng để kiểm thử chuyển khoản nhanh không cần tiền thật</div>
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
              onClick={() => (onCancelReservation ? onCancelReservation() : setShowCancelModal?.(true))}
              className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
            >
              ✕ Hủy giữ chỗ
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
                  <span>
                    {calculation.discountProgramName
                      ? `${calculation.discountProgramName}${
                          calculation.discountPercent > 0 && !calculation.discountProgramName.includes('%')
                            ? ` (-${calculation.discountPercent}%)`
                            : ''
                        }:`
                      : `Chiết khấu (-${calculation.discountPercent}%):`}
                  </span>
                  <span>-{formatVND(calculation.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tiền cọc giữ kho ({depositMultiplierLabel} tháng):</span>
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
  );
};
