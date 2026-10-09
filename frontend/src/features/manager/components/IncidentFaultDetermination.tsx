// frontend/src/features/manager/components/IncidentFaultDetermination.tsx
import React, { useState } from 'react';
import { AlertCircle, Check, DollarSign } from 'lucide-react';

interface IncidentFaultDeterminationProps {
  initialFaultType?: 'COMPANY' | 'CUSTOMER';
  initialCost?: number;
  initialFeeCategory?: string;
  onConfirmFault?: (data: { faultType: 'COMPANY' | 'CUSTOMER'; cost: number; feeCategory: string }) => void;
}

export const IncidentFaultDetermination: React.FC<IncidentFaultDeterminationProps> = ({
  initialFaultType = 'CUSTOMER',
  initialCost = 200000,
  initialFeeCategory = 'ACCESS_KEY',
  onConfirmFault,
}) => {
  const [faultType, setFaultType] = useState<'COMPANY' | 'CUSTOMER'>(initialFaultType);
  const [cost, setCost] = useState<number>(initialCost);
  const [feeCategory, setFeeCategory] = useState<string>(initialFeeCategory);

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Phân định trách nhiệm lỗi & Chi phí xử lý
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Lựa chọn 1: Lỗi công ty */}
        <label
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
            faultType === 'COMPANY'
              ? 'bg-brand-50/50 border-brand-500 ring-2 ring-brand-500/20'
              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              type="radio"
              name="fault_type"
              checked={faultType === 'COMPANY'}
              onChange={() => {
                setFaultType('COMPANY');
                setCost(0);
              }}
              className="mt-0.5 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Lỗi do Công ty / Hệ thống</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sự cố hao mòn tự nhiên, lỗi thiết bị cơ sở. Miễn phí 100% cho khách hàng.
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Chi phí thu khách:</span>
            <span className="font-bold text-emerald-600">0 đ</span>
          </div>
        </label>

        {/* Lựa chọn 2: Lỗi khách hàng */}
        <label
          className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
            faultType === 'CUSTOMER'
              ? 'bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <input
              type="radio"
              name="fault_type"
              checked={faultType === 'CUSTOMER'}
              onChange={() => {
                setFaultType('CUSTOMER');
                if (cost === 0) setCost(200000);
              }}
              className="mt-0.5 text-amber-600 focus:ring-amber-500"
            />
            <div>
              <span className="font-bold text-xs text-slate-900 block">Lỗi do Khách hàng gây ra</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Làm mất khóa, nhập sai PIN nhiều lần làm kẹt, hư hại vật lý do tác động ngoại lực.
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">Phụ phí sửa chữa:</span>
            <span className="font-bold text-rose-600">{fmt(cost)}</span>
          </div>
        </label>
      </div>

      {faultType === 'CUSTOMER' && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Khoản phụ phí BOM quy định:
              </label>
              <select
                value={feeCategory}
                onChange={(e) => setFeeCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-brand-500"
              >
                <option value="ACCESS_KEY">Cấp lại thẻ / Khóa cơ (200.000 đ)</option>
                <option value="DOOR_LOCK">Thay chốt khóa số (350.000 đ)</option>
                <option value="DAMAGE_REPAIR">Sửa chữa hư hỏng nhẹ (500.000 đ)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Số tiền phụ thu (VNĐ):
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-brand-500"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {onConfirmFault && (
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onConfirmFault({ faultType, cost, feeCategory })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Xác nhận phân định lỗi</span>
          </button>
        </div>
      )}
    </div>
  );
};
