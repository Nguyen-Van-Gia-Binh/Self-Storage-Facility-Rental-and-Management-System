// frontend/src/features/bom/components/SurchargeDrawer.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Tag,
  Building2,
  Loader2,
  Info,
  DollarSign,
  Percent,
} from 'lucide-react';
import type { FacilityListItem, CreateSurchargeRequest, SurchargeItem } from '@/types';
import { FEE_CATEGORIES, type FeeCategory } from '@/features/pricing/feeCategory';
import { useScrollLock } from '@/hooks/useScrollLock';

function vietnamToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateOnly(value?: string | null): string {
  if (!value) return '';
  return value.slice(0, 10);
}

function formatNumberWithCommas(val: string | number): string {
  const digits = String(val).replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('vi-VN');
}

function parseFormattedNumber(val: string): number {
  const digits = val.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

export type SurchargeDrawerSubmit =
  | { mode: 'create'; body: CreateSurchargeRequest }
  | {
      mode: 'edit';
      body: {
        name: string;
        category: FeeCategory;
        amount: number;
        effectiveDate?: string;
      };
    };

interface SurchargeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: FacilityListItem[];
  editing?: SurchargeItem | null;
  onSubmit: (data: SurchargeDrawerSubmit) => Promise<void>;
  isLoading?: boolean;
}

export const SurchargeDrawer: React.FC<SurchargeDrawerProps> = ({
  isOpen,
  onClose,
  facilities,
  editing = null,
  onSubmit,
  isLoading = false,
}) => {
  useScrollLock(isOpen);

  const todayStr = vietnamToday();
  const isEditing = editing != null;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FeeCategory | ''>('ACCESS_KEY');
  const [facilityId, setFacilityId] = useState<string>('');
  const [type, setType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');
  const [amountInput, setAmountInput] = useState('');
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState(todayStr);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (editing) {
        setName(editing.name || '');
        setCategory((editing.category as FeeCategory) || 'ACCESS_KEY');
        setFacilityId(editing.facilityId != null ? String(editing.facilityId) : '');
        setType(editing.type || 'FIXED');
        setAmountInput(
          editing.type === 'PERCENTAGE'
            ? String(editing.amount)
            : formatNumberWithCommas(editing.amount)
        );
        const ed = dateOnly(editing.effectiveDate);
        if (ed) {
          setIsIndefinite(false);
          setEffectiveDate(ed);
        } else {
          setIsIndefinite(true);
          setEffectiveDate(todayStr);
        }
      } else {
        setName('');
        setCategory('ACCESS_KEY');
        setFacilityId('');
        setType('FIXED');
        setAmountInput('');
        setIsIndefinite(true);
        setEffectiveDate(todayStr);
      }
    }
  }, [isOpen, editing, todayStr]);

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

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (type === 'PERCENTAGE') {
      const digits = raw.replace(/[^0-9]/g, '');
      const num = parseInt(digits, 10);
      if (isNaN(num)) {
        setAmountInput('');
      } else {
        setAmountInput(String(Math.min(100, Math.max(0, num))));
      }
    } else {
      setAmountInput(formatNumberWithCommas(raw));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = 'Tên phụ phí không được để trống';
    } else if (name.trim().length < 3) {
      errs.name = 'Tên phụ phí phải từ 3 ký tự trở lên';
    }

    if (!category) {
      errs.category = 'Vui lòng chọn nhóm phụ phí';
    }

    const num = type === 'PERCENTAGE' ? parseInt(amountInput, 10) : parseFormattedNumber(amountInput);
    if (!amountInput || isNaN(num) || num <= 0) {
      errs.amount = 'Mức phí phải là số nguyên lớn hơn 0';
    } else if (type === 'PERCENTAGE' && num > 100) {
      errs.amount = 'Tỷ lệ phần trăm tối đa là 100%';
    }

    if (!isIndefinite && !effectiveDate) {
      errs.effectiveDate = 'Vui lòng chọn ngày hiệu lực';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalAmount =
      type === 'PERCENTAGE' ? parseInt(amountInput, 10) : parseFormattedNumber(amountInput);

    const finalEffectiveDate = isIndefinite ? undefined : effectiveDate;

    if (isEditing) {
      await onSubmit({
        mode: 'edit',
        body: {
          name: name.trim(),
          category: category as FeeCategory,
          amount: finalAmount,
          effectiveDate: finalEffectiveDate,
        },
      });
    } else {
      await onSubmit({
        mode: 'create',
        body: {
          name: name.trim(),
          category: category as FeeCategory,
          facilityId: facilityId ? Number(facilityId) : null,
          type,
          amount: finalAmount,
          effectiveDate: finalEffectiveDate || todayStr,
        },
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
              <Tag className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {isEditing ? `Chỉnh sửa phụ phí #${editing.id}` : 'Thêm mới phụ phí hệ thống'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Cập nhật định mức và ngày hiệu lực áp dụng'
                  : 'Thiết lập danh mục phí dịch vụ và chế tài vận hành'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cảnh báo tác động dòng tiền khi sửa */}
          {isEditing && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 leading-relaxed shadow-2xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Cảnh báo tác động tài chính:</p>
                <p className="mt-0.5 text-amber-800">
                  Thay đổi mức phí sẽ áp dụng cho các phát sinh dịch vụ hoặc hợp đồng mới từ ngày hiệu lực{' '}
                  <strong>{isIndefinite ? 'Vô thời hạn' : effectiveDate}</strong>. Các giao dịch và biên lai cũ đã ghi nhận sẽ giữ nguyên giá trị lịch sử.
                </p>
              </div>
            </div>
          )}

          {/* Tên phụ phí */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên phụ phí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Phí cấp lại thẻ truy cập, Phí vệ sinh ô kho..."
              className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-400/20 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-amber-500/20 focus:border-amber-500'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Nhóm phụ phí */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nhóm danh mục <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeeCategory)}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            >
              {FEE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-rose-600 mt-1">{errors.category}</p>}
          </div>

          {/* Phạm vi áp dụng (chỉ chọn khi tạo mới) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phạm vi áp dụng
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{editing.facilityName || 'Toàn hệ thống'}</span>
                <span className="text-[11px] text-slate-400 ml-auto">(Không thể đổi cơ sở khi sửa)</span>
              </div>
            ) : (
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">Toàn hệ thống (Mặc định cho mọi cơ sở)</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.code || `FAC-${fac.id}`})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Hình thức tính phí (Segmented Control) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hình thức tính phí <span className="text-rose-500">*</span>
            </label>
            {isEditing ? (
              <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">
                {editing.type === 'PERCENTAGE' ? 'Tỷ lệ phần trăm (% giá thuê)' : 'Số tiền cố định (₫)'}
                <span className="text-[11px] text-slate-400 ml-2">(Không thay đổi hình thức)</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/90 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setType('FIXED');
                    setAmountInput('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    type === 'FIXED'
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Số tiền cố định (₫)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('PERCENTAGE');
                    setAmountInput('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    type === 'PERCENTAGE'
                      ? 'bg-white text-purple-700 shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Tỷ lệ % (% tháng)</span>
                </button>
              </div>
            )}
          </div>

          {/* Mức phí */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mức phí quy định <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder={type === 'PERCENTAGE' ? 'VD: 10' : 'VD: 150,000'}
                className={`w-full px-3.5 py-2.5 pr-14 bg-slate-50/50 border rounded-xl font-mono tabular-nums text-sm font-bold text-amber-600 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? 'border-rose-300 focus:ring-rose-400/20 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-amber-500/20 focus:border-amber-500'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                {type === 'PERCENTAGE' ? '%' : '₫'}
              </div>
            </div>
            {errors.amount && <p className="text-xs text-rose-600 mt-1">{errors.amount}</p>}
          </div>

          {/* Ngày hiệu lực */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ngày bắt đầu hiệu lực
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isIndefinite}
                  onChange={(e) => {
                    setIsIndefinite(e.target.checked);
                    if (e.target.checked) setEffectiveDate(todayStr);
                  }}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Áp dụng vô thời hạn / ngay</span>
              </label>
            </div>

            {!isIndefinite && (
              <div className="relative">
                <input
                  type="date"
                  value={effectiveDate}
                  min={todayStr}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={`w-full px-3.5 py-2.5 bg-slate-50/50 border rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    errors.effectiveDate
                      ? 'border-rose-300 focus:ring-rose-400/20 focus:border-rose-500'
                      : 'border-slate-300 focus:ring-amber-500/20 focus:border-amber-500'
                  }`}
                />
              </div>
            )}
            {errors.effectiveDate && (
              <p className="text-xs text-rose-600 mt-1">{errors.effectiveDate}</p>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200/90 bg-slate-50/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo phụ phí'}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
