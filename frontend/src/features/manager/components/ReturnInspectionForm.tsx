// frontend/src/features/manager/components/ReturnInspectionForm.tsx
import React, { useState } from 'react';
import { PackageOpen, CheckCircle2, Send } from 'lucide-react';

interface ReturnInspectionFormProps {
  depositAmount?: number;
  initialCondition?: 'GOOD' | 'DAMAGE';
  initialCleaningFee?: number;
  initialDamageFee?: number;
  onConfirmSettlement?: (data: { condition: 'GOOD' | 'DAMAGE'; damageCost: number; refundAmount: number }) => void;
  onRequestRecheck?: () => void;
}

export const ReturnInspectionForm: React.FC<ReturnInspectionFormProps> = ({
  depositAmount = 1500000,
  initialCondition = 'DAMAGE',
  initialCleaningFee = 200000,
  initialDamageFee = 500000,
  onConfirmSettlement,
  onRequestRecheck,
}) => {
  const [condition, setCondition] = useState<'GOOD' | 'DAMAGE'>(initialCondition);
  const cleaningFee = initialCleaningFee;
  const damageFee = initialDamageFee;
  const [hasCleaningIssue, setHasCleaningIssue] = useState<boolean>(true);
  const [hasDoorDamage, setHasDoorDamage] = useState<boolean>(true);

  const totalDeduction =
    condition === 'GOOD'
      ? 0
      : (hasCleaningIssue ? cleaningFee : 0) + (hasDoorDamage ? damageFee : 0);

  const refundAmount = Math.max(0, depositAmount - totalDeduction);

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <PackageOpen className="w-4 h-4 text-brand-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Kết quả nghiệm thu trả kho & Quyết toán hoàn cọc
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Lựa chọn 1: Nguyên trạng */}
        <label
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
            condition === 'GOOD'
              ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              type="radio"
              name="inspection_condition"
              checked={condition === 'GOOD'}
              onChange={() => setCondition('GOOD')}
              className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Kho nguyên trạng sạch sẽ</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Không phát hiện hư hại, hoàn 100% tiền cọc cho khách hàng.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hoàn cọc:</span>
            <span className="font-bold text-emerald-600">{fmt(depositAmount)} (100%)</span>
          </div>
        </label>

        {/* Lựa chọn 2: Có hư hỏng */}
        <label
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
            condition === 'DAMAGE'
              ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              type="radio"
              name="inspection_condition"
              checked={condition === 'DAMAGE'}
              onChange={() => setCondition('DAMAGE')}
              className="mt-0.5 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Có hư hại hoặc vệ sinh kém</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Khấu trừ tiền cọc theo biểu phí chi phí khắc phục BOM.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Khấu trừ:</span>
            <span className="font-bold text-rose-600">{fmt(totalDeduction)}</span>
          </div>
        </label>
      </div>

      {condition === 'DAMAGE' && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-2.5 text-xs">
          <span className="block font-bold text-slate-700 text-[11px] uppercase tracking-wider">
            Các khoản khấu trừ nghiệm thu:
          </span>

          <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasCleaningIssue}
                onChange={(e) => setHasCleaningIssue(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="text-slate-800 font-medium">Vệ sinh kém / Rác tồn dư</span>
            </div>
            <span className="font-bold text-slate-700">{fmt(cleaningFee)}</span>
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasDoorDamage}
                onChange={(e) => setHasDoorDamage(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <span className="text-slate-800 font-medium">Cửa cuốn móp méo / Hỏng khóa</span>
            </div>
            <span className="font-bold text-slate-700">{fmt(damageFee)}</span>
          </label>
        </div>
      )}

      {/* Bảng tổng kết tiền */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Tiền cọc ban đầu:</span>
            <span className="text-white font-semibold">{fmt(depositAmount)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Tổng trừ hư hại:</span>
            <span className="text-rose-400 font-semibold">- {fmt(totalDeduction)}</span>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
          <span className="text-slate-400 text-[11px] block">Tiền hoàn thực tế cho khách:</span>
          <span className="text-base font-bold text-emerald-400">{fmt(refundAmount)}</span>
        </div>
      </div>

      {/* Buttons hành động */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
        {onRequestRecheck && (
          <button
            type="button"
            onClick={onRequestRecheck}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-slate-500" />
            <span>Gửi lại khách xác nhận</span>
          </button>
        )}

        {onConfirmSettlement && (
          <button
            type="button"
            onClick={() =>
              onConfirmSettlement({
                condition,
                damageCost: totalDeduction,
                refundAmount,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Xác nhận quyết toán</span>
          </button>
        )}
      </div>
    </div>
  );
};
