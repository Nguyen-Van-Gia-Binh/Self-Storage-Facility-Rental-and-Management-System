// frontend/src/features/bom/components/PriceUpdateModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Calendar, AlertCircle, Loader2, Info } from 'lucide-react';
import type { UnitTypeCatalog } from '@/types';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  unitType: UnitTypeCatalog | null;
  onConfirm: (monthlyPrice: number, effectiveDate: string) => Promise<void>;
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
  const todayStr = new Date().toISOString().split('T')[0];

  const [priceInput, setPriceInput] = useState<string>(() =>
    unitType ? String(unitType.monthlyPrice) : '800000'
  );
  const [effectiveDate, setEffectiveDate] = useState<string>(todayStr);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !unitType) return null;

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(priceInput.replace(/[^0-9]/g, ''), 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Đơn giá thuê tháng phải là số nguyên lớn hơn 0');
      return;
    }

    if (priceNum % 1000 !== 0) {
      setError('Đơn giá thuê phải làm tròn đến hàng nghìn đồng (VD: 800,000 VND)');
      return;
    }

    if (!effectiveDate) {
      setError('Vui lòng chọn ngày bắt đầu có hiệu lực');
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
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">Cập nhật đơn giá tháng</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={validateAndSubmit} className="p-6 space-y-4">
          {/* Thông tin loại ô kho */}
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
              Giá hiện tại:{' '}
              <span className="font-bold text-amber-600">
                {unitType.monthlyPrice.toLocaleString('vi-VN')} VND / tháng
              </span>
            </p>
          </div>

          {/* Ô nhập giá mới */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Đơn giá mới (VND / tháng) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={priceInput}
                onChange={(e) => {
                  setPriceInput(e.target.value);
                  setError(null);
                }}
                placeholder="VD: 950000"
                className={`w-full text-sm font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all ${
                  error
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-normal">
                ≈ {formattedDisplayPrice(priceInput)} VND
              </span>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            )}
          </div>

          {/* Ngày hiệu lực */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Ngày bắt đầu có hiệu lực <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>

          {/* Lưu ý áp dụng giá */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-800 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Lưu ý áp dụng giá:</strong> Đơn giá mới chỉ áp dụng cho các lượt đặt chỗ và hợp đồng được tạo từ ngày hiệu lực trở đi. Các hợp đồng đã ký trước đó vẫn giữ nguyên đơn giá cam kết ban đầu.
            </p>
          </div>

          {/* Action buttons */}
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
