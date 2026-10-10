// frontend/src/features/manager/components/IncidentFaultDetermination.tsx
import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';

interface IncidentFaultDeterminationProps {
  faultType?: 'COMPANY' | 'CUSTOMER' | null;
  cost?: number;
  feeCategoryName?: string;
  isResolvedOrClosed?: boolean;
  staffName?: string;
}

export const IncidentFaultDetermination: React.FC<IncidentFaultDeterminationProps> = ({
  faultType = 'COMPANY',
  cost = 0,
  feeCategoryName,
  isResolvedOrClosed = true,
  staffName,
}) => {
  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Phân định trách nhiệm lỗi & Chi phí xử lý
            </h3>
            <p className="text-[11px] text-slate-500">
              Biên bản hiện trường được lập và xác nhận bởi nhân viên phụ trách ({staffName || 'Nhân viên kỹ thuật'})
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Chỉ đọc · Staff xác lập</span>
        </span>
      </div>

      {!isResolvedOrClosed && !faultType ? (
        /* Khi nhân viên chưa hoàn tất xử lý hiện trường */
        <div className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            ⏳ Nhân viên kỹ thuật đang kiểm tra hiện trường
          </p>
          <p className="text-[11px] text-slate-400">
            Kết quả xác định nguyên nhân sự cố và chi phí bồi thường (nếu có) sẽ được cập nhật tự động sau khi nhân viên hoàn thành xử lý.
          </p>
        </div>
      ) : (
        /* Kết quả phân định do Staff lập (Read-only cards) */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Lỗi do Công ty */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              faultType === 'COMPANY'
                ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/10'
                : 'bg-slate-50/40 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-4 h-4 ${
                      faultType === 'COMPANY' ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  Lỗi do Công ty / Hệ thống
                </span>
                {faultType === 'COMPANY' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ✓ Đã áp dụng
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                Sự cố hao mòn tự nhiên, hỏng hóc cơ sở vật chất. Cơ sở SmartStorage chịu 100% chi phí sửa chữa theo quy định BR-SUP-02.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Chi phí khách hàng:</span>
              <span className="font-bold text-emerald-600">0 đ (Miễn phí)</span>
            </div>
          </div>

          {/* Card 2: Lỗi do Khách hàng */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              faultType === 'CUSTOMER'
                ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/10'
                : 'bg-slate-50/40 border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      faultType === 'CUSTOMER' ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  />
                  Lỗi do Khách hàng gây ra
                </span>
                {faultType === 'CUSTOMER' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    ✓ Đã thu tiền tại chỗ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                Làm mất chìa/khóa, quên mã PIN, hư hại do tác động ngoại lực. Khách hàng đã thanh toán đủ 100% chi phí tại chỗ cho nhân viên kỹ thuật trước khi hoàn tất nghiệm thu.
              </p>

              {faultType === 'CUSTOMER' && feeCategoryName && (
                <div className="mt-2 text-[11px] font-medium text-amber-900 bg-amber-100/60 px-2.5 py-1 rounded-lg">
                  Khoản mục: {feeCategoryName}
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Đã thanh toán tại chỗ:</span>
              <span className="font-bold text-rose-600">
                {cost > 0 ? fmt(cost) : 'Đã thanh toán theo biểu phí'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
