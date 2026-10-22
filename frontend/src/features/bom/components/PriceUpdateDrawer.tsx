// frontend/src/features/bom/components/PriceUpdateDrawer.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  Info,
  Layers,
  TrendingUp,
  TrendingDown,
  Check,
  Bell,
} from 'lucide-react';
import type { UnitTypeCatalog } from '@/types';
import { useScrollLock } from '@/hooks/useScrollLock';

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

/**
 * Format số nguyên thành chuỗi có dấu phẩy ngăn cách hàng nghìn (VD: 500000 -> 500,000)
 */
function formatNumberWithCommas(val: string | number): string {
  const digits = String(val).replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
}

function parseFormattedNumber(val: string): number {
  const digits = val.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

interface PriceUpdateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  unitType?: UnitTypeCatalog | null;
  selectedUnitTypes?: UnitTypeCatalog[];
  onConfirmSingle?: (
    unitTypeId: number,
    pricePerM2: number,
    effectiveDate: string,
    reason?: string,
    notifyCustomers?: boolean
  ) => Promise<void>;
  onConfirmBulk?: (
    updates: { unitTypeId: number; pricePerM2: number }[],
    effectiveDate: string,
    reason?: string,
    notifyCustomers?: boolean
  ) => Promise<void>;
  isLoading?: boolean;
}

export const PriceUpdateDrawer: React.FC<PriceUpdateDrawerProps> = ({
  isOpen,
  onClose,
  facilityName,
  unitType,
  selectedUnitTypes = [],
  onConfirmSingle,
  onConfirmBulk,
  isLoading = false,
}) => {
  useScrollLock(isOpen);

  const isBulkMode = selectedUnitTypes.length > 1 || (!unitType && selectedUnitTypes.length > 0);
  const activeTargets = useMemo(() => {
    if (isBulkMode) return selectedUnitTypes;
    return unitType ? [unitType] : [];
  }, [isBulkMode, selectedUnitTypes, unitType]);

  const todayStr = vietnamToday();
  const [effectiveDate, setEffectiveDate] = useState<string>(todayStr);
  const [reason, setReason] = useState<string>('');
  const [notifyCustomers, setNotifyCustomers] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Single mode state
  const [singlePriceInput, setSinglePriceInput] = useState<string>('');

  // Bulk mode state
  const [bulkMethod, setBulkMethod] = useState<'PERCENT' | 'FIXED_PRICE'>('PERCENT');
  const [percentInput, setPercentInput] = useState<string>('10');
  const [bulkFixedPriceInput, setBulkFixedPriceInput] = useState<string>('800,000');

  useEffect(() => {
    if (isOpen) {
      setEffectiveDate(vietnamToday());
      setReason('');
      setError(null);
      if (unitType) {
        const initialRate = defaultPricePerM2(unitType);
        setSinglePriceInput(formatNumberWithCommas(initialRate));
      } else {
        setBulkMethod('PERCENT');
        setPercentInput('10');
        setBulkFixedPriceInput('800,000');
      }
    }
  }, [isOpen, unitType]);

  // Keyboard shortcut: Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Live preview for single mode
  const singlePreviewMonthly = useMemo(() => {
    if (!unitType) return 0;
    const rate = parseFormattedNumber(singlePriceInput);
    if (!rate || rate <= 0 || !unitType.areaM2) return 0;
    return roundToThousand(rate * unitType.areaM2);
  }, [singlePriceInput, unitType]);

  // Live preview for bulk mode
  const bulkCalculations = useMemo(() => {
    if (!isBulkMode) return [];
    const pct = parseFloat(percentInput) || 0;
    const fixedRate = parseFormattedNumber(bulkFixedPriceInput);

    return activeTargets.map((target) => {
      const currentRate = defaultPricePerM2(target);
      let newRate = currentRate;

      if (bulkMethod === 'PERCENT') {
        newRate = roundToThousand(currentRate * (1 + pct / 100));
      } else {
        newRate = fixedRate > 0 ? fixedRate : currentRate;
      }

      const currentMonthly = target.monthlyPrice > 0 ? target.monthlyPrice : roundToThousand(currentRate * target.areaM2);
      const newMonthly = roundToThousand(newRate * target.areaM2);
      const diff = newMonthly - currentMonthly;

      return {
        unitType: target,
        currentRate,
        newRate,
        currentMonthly,
        newMonthly,
        diff,
      };
    });
  }, [isBulkMode, activeTargets, bulkMethod, percentInput, bulkFixedPriceInput]);

  if (!isOpen || activeTargets.length === 0) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!effectiveDate) {
      setError('Vui lòng chọn ngày bắt đầu có hiệu lực');
      return;
    }

    if (effectiveDate < todayStr) {
      setError('Ngày hiệu lực không được ở trong quá khứ');
      return;
    }

    if (isBulkMode) {
      if (bulkMethod === 'PERCENT') {
        const pct = parseFloat(percentInput);
        if (isNaN(pct) || pct === 0) {
          setError('Vui lòng nhập tỷ lệ % điều chỉnh khác 0');
          return;
        }
      } else {
        const fixedNum = parseFormattedNumber(bulkFixedPriceInput);
        if (fixedNum <= 0) {
          setError('Vui lòng nhập đơn giá m² hợp lệ lớn hơn 0');
          return;
        }
      }

      const updates = bulkCalculations.map((item) => ({
        unitTypeId: item.unitType.id,
        pricePerM2: item.newRate,
      }));

      setError(null);
      if (onConfirmBulk) {
        await onConfirmBulk(updates, effectiveDate, reason.trim() || undefined, notifyCustomers);
      }
    } else {
      const singleNum = parseFormattedNumber(singlePriceInput);
      if (singleNum <= 0) {
        setError('Đơn giá 1 m² phải là số nguyên lớn hơn 0');
        return;
      }
      if (singleNum % 1000 !== 0) {
        setError('Đơn giá m² phải là bội số của 1.000 đồng (VD: 800.000 ₫/m²)');
        return;
      }

      setError(null);
      if (onConfirmSingle && unitType) {
        await onConfirmSingle(unitType.id, singleNum, effectiveDate, reason.trim() || undefined, notifyCustomers);
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <aside
        className="h-full w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col overflow-hidden border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {isBulkMode ? 'Cập nhật giá hàng loạt' : 'Cập nhật đơn giá 1 m²'}
              </h2>
              <p className="text-xs text-slate-300">
                {facilityName} · {isBulkMode ? `${activeTargets.length} loại kho được chọn` : activeTargets[0].name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm text-slate-700">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Context Banner */}
          {isBulkMode ? (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Đang cập nhật cho:
                </span>
                <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-xs">
                  {activeTargets.length} loại kho đã chọn
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {activeTargets.map((ut) => (
                  <span
                    key={ut.id}
                    className="inline-flex items-center text-[11px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {ut.name} ({ut.areaM2} m²)
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cơ sở áp dụng:</span>
                <span className="font-bold text-slate-900">{facilityName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Loại ô kho:</span>
                <span className="font-bold text-slate-900">{activeTargets[0].name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Diện tích tiêu chuẩn:</span>
                <span className="font-mono font-bold text-slate-900">{activeTargets[0].areaM2} m²</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-500">Giá thuê hiện tại:</span>
                <span className="font-bold text-amber-600 font-mono text-sm">
                  {activeTargets[0].monthlyPrice > 0
                    ? `${activeTargets[0].monthlyPrice.toLocaleString('vi-VN')} ₫/tháng`
                    : 'Chưa niêm yết'}
                </span>
              </div>
            </div>
          )}

          {/* BULK MODE: Segmented Control (Toggle % vs Fixed VNĐ) */}
          {isBulkMode && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phương thức điều chỉnh giá <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBulkMethod('PERCENT')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    bulkMethod === 'PERCENT'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Điều chỉnh theo %</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkMethod('FIXED_PRICE')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    bulkMethod === 'FIXED_PRICE'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Thiết lập đơn giá mới (₫/m²)</span>
                </button>
              </div>

              {/* Input for Percent */}
              {bulkMethod === 'PERCENT' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      value={percentInput}
                      onChange={(e) => {
                        setPercentInput(e.target.value);
                        setError(null);
                      }}
                      placeholder="VD: 10 (tăng 10%) hoặc -5 (giảm 5%)"
                      className="w-full text-sm font-bold border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10 font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-sm font-bold text-slate-500">
                      %
                    </span>
                  </div>
                  {/* Quick percentage pills */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Gợi ý nhanh:</span>
                    {['+5', '+10', '+15', '+20', '-5'].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setPercentInput(pill.replace('+', ''))}
                        className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {pill}%
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Input for Fixed Price */
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={bulkFixedPriceInput}
                      onChange={(e) => {
                        setBulkFixedPriceInput(formatNumberWithCommas(e.target.value));
                        setError(null);
                      }}
                      placeholder="VD: 800,000"
                      className="w-full text-sm font-bold border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-16 font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-500">
                      ₫/m²
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SINGLE MODE: Đơn giá 1 m² */}
          {!isBulkMode && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đơn giá mới cho 1 m² (₫/m²) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={singlePriceInput}
                    onChange={(e) => {
                      setSinglePriceInput(formatNumberWithCommas(e.target.value));
                      setError(null);
                    }}
                    placeholder="VD: 800,000"
                    className="w-full text-base font-bold border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-16 font-mono tabular-nums"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-500 font-medium">
                    ₫/m²
                  </span>
                </div>
              </div>

              {/* Tính toán tự động minh bạch */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center justify-between">
                  <span>Giá thuê tháng ước tính:</span>
                  <span className="text-sm font-mono text-amber-700 font-bold">
                    {singlePreviewMonthly > 0
                      ? `${singlePreviewMonthly.toLocaleString('vi-VN')} ₫/tháng`
                      : '—'}
                  </span>
                </p>
                <p className="text-[11px] text-amber-700/90">
                  (= đơn giá × {unitType?.areaM2} m², tự động làm tròn đến 1.000 đồng)
                </p>
              </div>
            </div>
          )}

          {/* BULK MODE: LIVE PREVIEW BẢNG TÓM TẮT THAY ĐỔI */}
          {isBulkMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Bảng xem trước thay đổi (Live Preview)
                </label>
                <span className="text-[11px] text-slate-400">
                  Làm tròn đến 1.000 đồng
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Loại kho</th>
                      <th className="py-2 px-3 text-right">Giá cũ</th>
                      <th className="py-2 px-3 text-right">Giá mới</th>
                      <th className="py-2 px-3 text-right">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {bulkCalculations.map((item) => (
                      <tr key={item.unitType.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-800">{item.unitType.name}</p>
                          <p className="text-[10px] text-slate-400">{item.unitType.areaM2} m²</p>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-500">
                          {item.currentMonthly.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-blue-700">
                          {item.newMonthly.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums">
                          {item.diff > 0 ? (
                            <span className="text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                              <TrendingUp className="w-3 h-3" />
                              +{item.diff.toLocaleString('vi-VN')} ₫
                            </span>
                          ) : item.diff < 0 ? (
                            <span className="text-rose-600 font-semibold flex items-center justify-end gap-0.5">
                              <TrendingDown className="w-3 h-3" />
                              {item.diff.toLocaleString('vi-VN')} ₫
                            </span>
                          ) : (
                            <span className="text-slate-400">0 ₫</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Ngày bắt đầu có hiệu lực */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ngày bắt đầu có hiệu lực <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                value={effectiveDate}
                min={todayStr}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nếu chọn ngày trong tương lai, bảng giá hiện tại sẽ tiếp tục chạy cho đến ngày hẹn.
            </p>
          </div>

          {/* Lý do thay đổi giá (Lưu Audit log) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Lý do thay đổi giá (Lưu vết kiểm toán)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="VD: Điều chỉnh theo lạm phát năm 2027, Chiến dịch kích cầu mùa hè..."
              className="w-full text-xs border border-slate-300 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          {/* Checkbox: Gửi thông báo cho khách hàng */}
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <input
              type="checkbox"
              id="notifyCustomers"
              checked={notifyCustomers}
              onChange={(e) => setNotifyCustomers(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="notifyCustomers" className="text-xs text-slate-700 cursor-pointer leading-snug">
              <span className="font-semibold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-blue-600" />
                Gửi email thông báo chính sách giá mới
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Tự động gửi thông báo minh bạch cho các khách hàng đang thuê ô kho thuộc diện điều chỉnh.
              </span>
            </label>
          </div>

          {/* Khối Cảnh báo tác động nghiệp vụ (UX Best Practice) */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2 text-[11px] text-amber-900 leading-relaxed">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý áp dụng giá:</strong> Đơn giá mới chỉ áp dụng cho các đặt chỗ và hợp đồng
              tạo từ ngày hiệu lực trở đi. Các hợp đồng đã ký tiếp tục giữ nguyên snapshot giá cam kết
              cho đến hết kỳ hạn thuê.
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <Check className="w-4 h-4" />
            <span>
              {isBulkMode
                ? `Cập nhật ${activeTargets.length} loại kho`
                : 'Lưu đơn giá mới'}
            </span>
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
};
