// frontend/src/features/manager/components/IncidentFaultDetermination.tsx
import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

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
    <div className="py-5 border-b border-slate-200">
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
        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            ⏳ Nhân viên kỹ thuật đang kiểm tra hiện trường
          </p>
          <p className="text-[11px] text-slate-400">
            Kết quả xác định nguyên nhân sự cố và chi phí bồi thường (nếu có) sẽ được cập nhật tự động sau khi nhân viên hoàn thành xử lý.
          </p>
        </div>
      ) : (
        /* Kết quả phân định do Staff lập (Read-only cards) */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div
            className={`p-4 rounded-lg border ${
              faultType === 'COMPANY'
                ? 'bg-white border-2 border-brand-500'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <p className={`text-sm font-bold ${faultType === 'COMPANY' ? 'text-slate-900' : 'text-slate-500'}`}>
              Lỗi do Công ty / Hệ thống
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cơ sở chịu 100% chi phí sửa chữa.
            </p>
            {faultType === 'COMPANY' && (
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Tổng thu:</span>
                <span className="font-bold text-rose-600 tabular-nums">0 đ</span>
              </div>
            )}
          </div>

          <div
            className={`p-4 rounded-lg border ${
              faultType === 'CUSTOMER'
                ? 'bg-white border-2 border-brand-500'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <p className={`text-sm font-bold ${faultType === 'CUSTOMER' ? 'text-slate-900' : 'text-slate-500'}`}>
              Lỗi do Khách hàng gây ra
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Đã thu tiền tại chỗ
            </p>
            {faultType === 'CUSTOMER' && (
              <>
                <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
                  {feeCategoryName || 'Chi phí xử lý'}
                </p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 text-sm">
                  <span className="font-bold text-slate-900">Tổng thu:</span>
                  <span className="font-bold text-rose-600 tabular-nums">
                    {cost > 0 ? fmt(cost) : 'Theo biểu phí'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
