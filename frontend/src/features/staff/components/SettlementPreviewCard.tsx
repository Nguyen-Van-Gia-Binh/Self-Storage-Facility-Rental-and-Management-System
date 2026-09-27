import React from 'react';
import { DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { InspectionCondition } from '@/types';

interface SettlementPreviewCardProps {
  depositAmount: number;
  damageCost: number;
  overdueFee?: number;
  unpaidExtraCharges?: number;
  condition: InspectionCondition;
}

export const SettlementPreviewCard: React.FC<SettlementPreviewCardProps> = ({
  depositAmount,
  damageCost,
  overdueFee = 0,
  unpaidExtraCharges = 0,
  condition,
}) => {
  // Áp dụng công thức BR-RET-04
  const totalDeductions = damageCost + overdueFee + unpaidExtraCharges;
  const refundAmount = Math.max(0, depositAmount - totalDeductions);
  const payableAmount = Math.max(0, totalDeductions - depositAmount);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Dự toán quyết toán hoàn cọc</h3>
            <p className="text-xs text-slate-500">Tiêu chuẩn thanh lý hợp đồng & quyết toán cọc</p>
          </div>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            condition === 'GOOD'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : condition === 'MINOR_DAMAGE'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {condition === 'GOOD'
            ? 'Đạt chuẩn (100% Cọc)'
            : condition === 'MINOR_DAMAGE'
            ? 'Khấu trừ hư hại nhẹ'
            : 'Hư hại kết cấu nặng'}
        </span>
      </div>

      {/* Chi tiết khấu trừ */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Tiền cọc Deposit ban đầu:</span>
          <span className="font-mono font-medium text-slate-900">
            {depositAmount.toLocaleString('vi-VN')} đ
          </span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span className="flex items-center gap-1">
            (-) Chi phí bồi thường hư hại:
            {damageCost > 0 && <span className="text-rose-500 text-xs">*</span>}
          </span>
          <span className={`font-mono font-medium ${damageCost > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {damageCost > 0 ? `-${damageCost.toLocaleString('vi-VN')} đ` : '0 đ'}
          </span>
        </div>

        {overdueFee > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>(-) Phí quá hạn tích lũy:</span>
            <span className="font-mono font-medium text-rose-600">
              -{overdueFee.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}

        {unpaidExtraCharges > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>(-) Phụ phí chưa thanh toán:</span>
            <span className="font-mono font-medium text-rose-600">
              -{unpaidExtraCharges.toLocaleString('vi-VN')} đ
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
          <div>
            <span className="font-semibold text-slate-900">
              {payableAmount > 0 ? 'Số tiền khách phải nộp thêm:' : 'Số tiền cọc hoàn trả khách:'}
            </span>
            <p className="text-[11px] text-slate-400">
              {payableAmount > 0
                ? 'Hư hại vượt quá tiền cọc giữ chỗ ban đầu'
                : 'FM sẽ duyệt chuyển khoản hoàn cọc trong 7 ngày làm việc'}
            </p>
          </div>
          <span
            className={`font-mono text-xl font-bold ${
              payableAmount > 0 ? 'text-rose-600' : 'text-teal-600'
            }`}
          >
            {payableAmount > 0
              ? `${payableAmount.toLocaleString('vi-VN')} đ`
              : `${refundAmount.toLocaleString('vi-VN')} đ`}
          </span>
        </div>
      </div>

      {/* Cảnh báo hoặc gợi ý */}
      {condition === 'GOOD' ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Mặt bằng nguyên vẹn. Đề xuất hoàn 100% tiền cọc cho khách hàng.</span>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Khấu trừ {damageCost.toLocaleString('vi-VN')} đ tiền bồi thường. Bắt buộc cung cấp ít nhất 1 ảnh chụp hiện trường để FM đối soát.
          </span>
        </div>
      )}
    </div>
  );
};
