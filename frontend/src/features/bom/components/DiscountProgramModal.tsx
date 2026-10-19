// frontend/src/features/bom/components/DiscountProgramModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Percent, Loader2 } from 'lucide-react';
import type { FacilityListItem } from '@/types';
import type {
  DiscountProgramItem,
  CreateDiscountProgramPayload,
  UpdateDiscountProgramPayload,
} from '@/api/discount';

function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function dateOnly(val?: string | null): string {
  if (!val) return '';
  return val.slice(0, 10);
}

interface DiscountProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: FacilityListItem[];
  editing?: DiscountProgramItem | null;
  onSubmit: (payload: CreateDiscountProgramPayload | UpdateDiscountProgramPayload) => Promise<void>;
  isLoading?: boolean;
}

export const DiscountProgramModal: React.FC<DiscountProgramModalProps> = ({
  isOpen,
  onClose,
  facilities,
  editing = null,
  onSubmit,
  isLoading = false,
}) => {
  const isEditing = Boolean(editing);

  const [formData, setFormData] = useState({
    name: editing?.name ?? '',
    discountType: (editing?.discountType ?? 'PERCENT') as 'PERCENT' | 'AMOUNT',
    discountValue: editing?.discountValue != null ? String(editing.discountValue) : '5',
    minRentalMonths: editing?.minRentalMonths != null ? String(editing.minRentalMonths) : '6',
    startDate: editing ? dateOnly(editing.startDate) : todayIso(),
    endDate: editing ? dateOnly(editing.endDate) : '',
    scopeType: (editing?.scopeType ?? 'SYSTEM') as 'SYSTEM' | 'FACILITY' | 'UNIT_TYPE',
    facilityId: editing?.facilityId != null ? String(editing.facilityId) : '',
    unitTypeId: editing?.unitTypeId != null ? String(editing.unitTypeId) : '',
    isActive: editing?.isActive ?? true,
  });

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

  useEffect(() => {
    if (editing) {
      setFormData({
        name: editing.name,
        discountType: editing.discountType,
        discountValue: String(editing.discountValue),
        minRentalMonths: String(editing.minRentalMonths),
        startDate: dateOnly(editing.startDate),
        endDate: dateOnly(editing.endDate),
        scopeType: editing.scopeType,
        facilityId: editing.facilityId != null ? String(editing.facilityId) : '',
        unitTypeId: editing.unitTypeId != null ? String(editing.unitTypeId) : '',
        isActive: editing.isActive,
      });
    } else {
      setFormData({
        name: '',
        discountType: 'PERCENT',
        discountValue: '5',
        minRentalMonths: '6',
        startDate: todayIso(),
        endDate: '',
        scopeType: 'SYSTEM',
        facilityId: facilities.length > 0 ? String(facilities[0].id) : '',
        unitTypeId: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [editing, isOpen, facilities]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Vui lòng nhập tên chương trình';
    }

    const val = Number(formData.discountValue);
    if (!formData.discountValue || isNaN(val) || val <= 0) {
      errs.discountValue = 'Mức giảm phải là số lớn hơn 0';
    } else if (formData.discountType === 'PERCENT' && val > 100) {
      errs.discountValue = 'Tỷ lệ giảm giá không được vượt quá 100%';
    }

    const months = Number(formData.minRentalMonths);
    if (!formData.minRentalMonths || isNaN(months) || months < 1) {
      errs.minRentalMonths = 'Số tháng thuê tối thiểu phải từ 1 trở lên';
    }

    if (!formData.startDate) {
      errs.startDate = 'Vui lòng chọn ngày bắt đầu';
    }
    if (!formData.endDate) {
      errs.endDate = 'Vui lòng chọn ngày kết thúc';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errs.endDate = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu';
    }

    if (formData.scopeType === 'FACILITY' && !formData.facilityId) {
      errs.facilityId = 'Vui lòng chọn cơ sở áp dụng';
    }
    if (formData.scopeType === 'UNIT_TYPE' && !formData.unitTypeId) {
      errs.unitTypeId = 'Vui lòng nhập mã loại kho';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateDiscountProgramPayload = {
      name: formData.name.trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minRentalMonths: Number(formData.minRentalMonths),
      startDate: formData.startDate,
      endDate: formData.endDate,
      scopeType: formData.scopeType,
      facilityId: formData.scopeType === 'FACILITY' && formData.facilityId ? Number(formData.facilityId) : null,
      unitTypeId: formData.scopeType === 'UNIT_TYPE' && formData.unitTypeId ? Number(formData.unitTypeId) : null,
    };

    if (isEditing) {
      await onSubmit({
        ...payload,
        isActive: formData.isActive,
      });
    } else {
      await onSubmit(payload);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Chỉnh sửa chương trình ưu đãi' : 'Tạo mới chương trình ưu đãi'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Cập nhật điều kiện và mức giảm' : 'Thiết lập ưu đãi giảm giá theo kỳ hạn'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Tên chương trình */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên chương trình ưu đãi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Ưu đãi thuê từ 6 tháng (5%)"
              className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-amber-200 focus:border-amber-500'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          {/* Loại giảm giá & Mức giảm */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loại giảm giá <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountType: e.target.value as 'PERCENT' | 'AMOUNT',
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 bg-white"
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="AMOUNT">Số tiền cố định (₫)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mức giảm {formData.discountType === 'PERCENT' ? '(%)' : '(₫)'}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step={formData.discountType === 'PERCENT' ? '0.5' : '1000'}
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                placeholder={formData.discountType === 'PERCENT' ? '5' : '500000'}
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                  errors.discountValue
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-amber-200 focus:border-amber-500'
                }`}
              />
              {errors.discountValue && (
                <p className="text-xs text-rose-500 mt-1">{errors.discountValue}</p>
              )}
            </div>
          </div>

          {/* Số tháng thuê tối thiểu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số tháng thuê tối thiểu <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                value={formData.minRentalMonths}
                onChange={(e) => setFormData({ ...formData, minRentalMonths: e.target.value })}
                placeholder="6"
                className={`w-32 px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                  errors.minRentalMonths
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-amber-200 focus:border-amber-500'
                }`}
              />
              <span className="text-xs text-slate-500">tháng (Khách thuê từ số tháng này trở lên sẽ đủ điều kiện)</span>
            </div>
            {errors.minRentalMonths && (
              <p className="text-xs text-rose-500 mt-1">{errors.minRentalMonths}</p>
            )}
          </div>

          {/* Ngày bắt đầu & Ngày kết thúc */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDateInput" className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày bắt đầu <span className="text-rose-500">*</span>
              </label>
              <input
                id="startDateInput"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                  errors.startDate
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-amber-200 focus:border-amber-500'
                }`}
              />
              {errors.startDate && <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDateInput" className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày kết thúc <span className="text-rose-500">*</span>
              </label>
              <input
                id="endDateInput"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 ${
                  errors.endDate
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-amber-200 focus:border-amber-500'
                }`}
              />
              {errors.endDate && <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Phạm vi áp dụng */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phạm vi áp dụng <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.scopeType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scopeType: e.target.value as 'SYSTEM' | 'FACILITY' | 'UNIT_TYPE',
                })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 bg-white"
            >
              <option value="SYSTEM">Toàn hệ thống (Tất cả cơ sở & loại kho)</option>
              <option value="FACILITY">Riêng một cơ sở cụ thể</option>
              <option value="UNIT_TYPE">Riêng một loại kho cụ thể</option>
            </select>
          </div>

          {formData.scopeType === 'FACILITY' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chọn cơ sở <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.facilityId}
                onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500 bg-white"
              >
                <option value="">-- Chọn cơ sở --</option>
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.code})
                  </option>
                ))}
              </select>
              {errors.facilityId && (
                <p className="text-xs text-rose-500 mt-1">{errors.facilityId}</p>
              )}
            </div>
          )}

          {formData.scopeType === 'UNIT_TYPE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID loại kho <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.unitTypeId}
                onChange={(e) => setFormData({ ...formData, unitTypeId: e.target.value })}
                placeholder="Nhập ID loại kho (VD: 1)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
              />
              {errors.unitTypeId && (
                <p className="text-xs text-rose-500 mt-1">{errors.unitTypeId}</p>
              )}
            </div>
          )}

          {/* Trạng thái kích hoạt (chỉ hiện khi sửa) */}
          {isEditing && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
              />
              <label htmlFor="isActiveCheck" className="text-sm font-medium text-slate-700">
                Kích hoạt chương trình (Đang áp dụng)
              </label>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEditing ? 'Lưu thay đổi' : 'Tạo chương trình'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
