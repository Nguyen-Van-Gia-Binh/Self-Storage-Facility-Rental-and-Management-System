// frontend/src/features/bom/components/PriceUpdateModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, AlertCircle, Loader2, Info } from 'lucide-react';
import type { UnitTypeCatalog } from '@/types';

function vietnamToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function roundToThousand(value: number): number {
  return Math.round(value / 1000) * 1000;
}

function defaultPricePerM2(unitType: UnitTypeCatalog): number {
  if (unitType.pricePerM2 != null && unitType.pricePerM2 > 0) {
    return unitType.pricePerM2;
  }
  if (unitType.monthlyPrice > 0 && unitType.areaM2 > 0) {
    return roundToThousand(unitType.monthlyPrice / unitType.areaM2);
  }
  return 800000;
}

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  unitType: UnitTypeCatalog | null;
  onConfirm: (pricePerM2: number, effectiveDate: string) => Promise<void>;
  isLoading?: boolean;
}

export const PriceUpdateModal: React.FC<PriceUpdateModalProps> = ({
  isOpen,
  onClose,
  facilityName,
  unitType,
  onConfirm,
  isLoading = false,
}) => {
  const todayStr = vietnamToday();

  const [priceInput, setPriceInput] = useState<string>(() =>
    unitType ? String(defaultPricePerM2(unitType)) : '800000'
  );
  const [effectiveDate, setEffectiveDate] = useState<string>(todayStr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && unitType) {
      setPriceInput(String(defaultPricePerM2(unitType)));
      setEffectiveDate(vietnamToday());
      setError(null);
    }
  }, [isOpen, unitType]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const previewMonthly = useMemo(() => {
    if (!unitType) return 0;
    const rate = parseInt(priceInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(rate) || rate <= 0 || !unitType.areaM2) return 0;
    return roundToThousand(rate * unitType.areaM2);
  }, [priceInput, unitType]);

  if (!isOpen || !unitType) return null;

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(priceInput.replace(/[^0-9]/g, ''), 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Đơn giá 1 m² phải là số nguyên lớn hơn 0');
      return;
    }

    if (priceNum % 1000 !== 0) {
      setError('Đơn giá m² phải là bội số của 1.000 đồng (VD: 800.000 VND/m²)');
      return;
    }

    if (!effectiveDate) {
      setError('Vui lòng chọn ngày bắt đầu có hiệu lực');
      return;
    }

    if (effectiveDate < vietnamToday()) {
      setError('Ngày hiệu lực không được ở quá khứ');
      return;
    }

    setError(null);
    await onConfirm(priceNum, effectiveDate);
  };

  const formattedDisplayPrice = (val: string) => {
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? '0' : num.toLocaleString('vi-VN');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Cập nhật đơn giá 1 m²</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={validateAndSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <p className="text-slate-500">
              Cơ sở: <span className="font-bold text-slate-800">{facilityName}</span>
            </p>
            <p className="text-slate-500">
              Loại ô kho: <span className="font-bold text-slate-800">{unitType.name}</span> (
              {unitType.areaM2} m²)
            </p>
            <p className="text-slate-500">
              Kích thước: {unitType.widthM}m × {unitType.depthM}m × {unitType.heightM}m
            </p>
            <p className="text-slate-500">
              Giá thuê tháng hiện tại:{' '}
              <span className="font-bold text-amber-600">
                {unitType.monthlyPrice > 0
                  ? `${unitType.monthlyPrice.toLocaleString('vi-VN')} VND / tháng`
                  : 'Chưa niêm yết'}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Đơn giá 1 m² (VNĐ/m²/tháng) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  setError(null);
                }}
                placeholder="VD: 800000"
                className={`w-full text-sm font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all ${
                  error
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-normal">
                ≈ {formattedDisplayPrice(priceInput)} VND/m²
              </span>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            )}
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <p className="font-semibold mb-0.5">Giá thuê tháng = đơn giá × diện tích</p>
            <p>
              {previewMonthly > 0
                ? `${previewMonthly.toLocaleString('vi-VN')} VNĐ / tháng`
                : '—'}{' '}
              <span className="text-amber-700/80">
                (= đơn giá × {unitType.areaM2} m², làm tròn 1.000)
              </span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Ngày bắt đầu có hiệu lực <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                value={effectiveDate}
                min={todayStr}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-800 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Lưu ý áp dụng giá:</strong> Đơn giá m² mới chỉ áp dụng cho đặt chỗ và hợp đồng
              tạo từ ngày hiệu lực trở đi. Hợp đồng đã ký giữ nguyên snapshot giá cam kết.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Lưu đơn giá mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
