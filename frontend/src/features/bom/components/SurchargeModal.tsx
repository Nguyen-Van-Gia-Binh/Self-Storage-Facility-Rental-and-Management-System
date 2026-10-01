// frontend/src/features/bom/components/SurchargeModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Tag, Calendar, Building2, AlertCircle, Loader2 } from 'lucide-react';
import type { FacilityListItem, CreateSurchargeRequest, SurchargeItem } from '@/types';
import { FEE_CATEGORIES, type FeeCategory } from '@/features/pricing/feeCategory';

function vietnamToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Giữ dấu trừ. Chỉ nhận số nguyên dương; số âm, số 0 và chữ không được đổi thành số dương. */
function parsePositiveInteger(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const num = Number(text);
  if (!Number.isSafeInteger(num) || num <= 0) return null;
  return num;
}

export type SurchargeModalSubmit =
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

interface SurchargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: FacilityListItem[];
  editing?: SurchargeItem | null;
  onSubmit: (data: SurchargeModalSubmit) => Promise<void>;
  isLoading?: boolean;
}

export const SurchargeModal: React.FC<SurchargeModalProps> = ({
  isOpen,
  onClose,
  facilities,
  editing = null,
  onSubmit,
  isLoading = false,
}) => {
  const todayStr = vietnamToday();
  const isEditing = editing != null;
  const originalDate = editing ? dateOnly(editing.effectiveDate) : '';
  const originalIsPast = isEditing && originalDate < todayStr;

  const [formData, setFormData] = useState(() => ({
    name: editing?.name ?? '',
    category: (editing?.category || '') as '' | FeeCategory,
    facilityId: editing?.facilityId != null ? String(editing.facilityId) : '',
    type: (editing?.type ?? 'FIXED') as 'FIXED' | 'PERCENTAGE',
    amount: editing ? String(editing.amount) : '',
    effectiveDate: editing && !originalIsPast ? originalDate : todayStr,
    newEffectiveDate: '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) {
      errs.name = 'Tên phụ phí không được để trống';
    } else if (formData.name.trim().length < 3) {
      errs.name = 'Tên phụ phí phải từ 3 ký tự trở lên';
    }
    if (!formData.category) {
      errs.category = 'Chọn nhóm phụ phí';
    }

    const num = parsePositiveInteger(formData.amount);
    if (formData.type === 'PERCENTAGE') {
      if (num == null || num > 100) {
        errs.amount = 'Tỷ lệ phần trăm phải từ 1% đến 100%';
      }
    } else if (num == null) {
      errs.amount = 'Mức phí phải lớn hơn 0';
    }

    const chosenDate = originalIsPast ? formData.newEffectiveDate : formData.effectiveDate;
    if (!isEditing || !originalIsPast) {
      if (!chosenDate) {
        errs.effectiveDate = 'Vui lòng chọn ngày hiệu lực';
      } else if (chosenDate < todayStr) {
        errs.effectiveDate = 'Ngày hiệu lực không được ở quá khứ';
      }
    } else if (chosenDate && chosenDate < todayStr) {
      errs.effectiveDate = 'Ngày hiệu lực không được ở quá khứ';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const num = parsePositiveInteger(formData.amount);
    if (num == null) return;
    const category = formData.category as FeeCategory;
    if (isEditing) {
      const chosenDate = originalIsPast ? formData.newEffectiveDate : formData.effectiveDate;
      const effectiveDate =
        chosenDate && chosenDate >= todayStr && chosenDate !== originalDate ? chosenDate : undefined;
      await onSubmit({
        mode: 'edit',
        body: {
          name: formData.name.trim(),
          category,
          amount: num,
          effectiveDate,
        },
      });
      return;
    }

    await onSubmit({
      mode: 'create',
      body: {
        name: formData.name.trim(),
        category,
        facilityId: formData.facilityId ? Number(formData.facilityId) : null,
        type: formData.type,
        amount: num,
        effectiveDate: formData.effectiveDate,
      },
    });
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
            <Tag className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">
              {isEditing ? 'Sửa phụ phí' : 'Thêm khoản phụ phí mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tên phụ phí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Cấp lại khóa cơ, Phí vệ sinh, Pallet..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full text-sm border rounded-xl px-3.5 py-2.5 outline-none transition-all ${
                errors.name
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Nhóm phụ phí <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as '' | FeeCategory })
              }
              className={`w-full text-sm border rounded-xl px-3.5 py-2.5 outline-none bg-white ${
                errors.category
                  ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
              }`}
            >
              <option value="">Chọn nhóm</option>
              {FEE_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.category}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Phạm vi cơ sở áp dụng
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <select
                value={formData.facilityId}
                disabled={isEditing}
                onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Toàn hệ thống (Tất cả cơ sở)</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>
            {isEditing && (
              <p className="mt-1 text-[11px] text-slate-500">Phạm vi không đổi sau khi tạo.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Loại phụ phí
              </label>
              <select
                value={formData.type}
                disabled={isEditing}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as 'FIXED' | 'PERCENTAGE',
                    amount: '',
                  })
                }
                className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 bg-white font-medium disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="FIXED">Cố định (VND)</option>
                <option value="PERCENTAGE">Phần trăm (%)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                {formData.type === 'FIXED' ? 'Số tiền (VND)' : 'Tỷ lệ (%)'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder={formData.type === 'FIXED' ? '150000' : '10'}
                className={`w-full text-sm font-bold border rounded-xl px-3.5 py-2.5 outline-none transition-all ${
                  errors.amount
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>
          </div>
          {isEditing && (
            <p className="-mt-2 text-[11px] text-slate-500">Hình thức không đổi sau khi tạo.</p>
          )}
          {errors.amount && (
            <p className="text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.amount}
            </p>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              {originalIsPast ? 'Ngày hiệu lực hiện tại' : 'Ngày bắt đầu có hiệu lực'}{' '}
              {!originalIsPast && <span className="text-rose-500">*</span>}
            </label>
            {originalIsPast ? (
              <p className="text-sm text-slate-700">{originalDate}</p>
            ) : (
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={formData.effectiveDate}
                  min={todayStr}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            )}
            {originalIsPast && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Ngày hiệu lực mới
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    value={formData.newEffectiveDate}
                    min={todayStr}
                    onChange={(e) => setFormData({ ...formData, newEffectiveDate: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Để trống nếu giữ ngày hiện tại. Ngày đã qua không gửi lại.
                </p>
              </div>
            )}
            {errors.effectiveDate && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.effectiveDate}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Lưu thay đổi' : 'Thêm phụ phí'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
