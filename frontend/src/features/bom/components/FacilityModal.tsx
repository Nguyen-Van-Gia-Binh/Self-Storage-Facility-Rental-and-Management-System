// frontend/src/features/bom/components/FacilityModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, MapPin, Phone, Clock, FileText, Loader2, AlertCircle } from 'lucide-react';
import type { FacilityListItem, CreateFacilityRequest, UpdateFacilityRequest } from '@/types';

const FACILITY_CODE_PATTERN = /^FAC-[A-Z][A-Z0-9]{1,3}$/;
const FACILITY_CODE_HINT = 'Quận 7 → FAC-Q7. Cầu Giấy → FAC-CG. Trùng thì thêm số: FAC-CG2.';
const FACILITY_CODE_ERROR =
  'Mã cơ sở phải có dạng FAC- và 2–4 ký tự, bắt đầu bằng chữ (ví dụ FAC-Q7, FAC-CG)';
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function toTimeInputValue(value: string): string {
  return value === '24:00' ? '23:59' : value;
}

function parseOpeningHours(value?: string): { openTime: string; closeTime: string } {
  const fallback = { openTime: '06:00', closeTime: '22:00' };
  if (!value) return fallback;
  const match = value.trim().match(/^(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/);
  if (!match) return fallback;
  const openTime = toTimeInputValue(match[1]);
  const closeTime = toTimeInputValue(match[2]);
  if (!TIME_PATTERN.test(openTime) || !TIME_PATTERN.test(closeTime)) return fallback;
  return { openTime, closeTime };
}

function digitsOnlyPhone(value?: string): string {
  return (value || '').replace(/\D/g, '').slice(0, 10);
}

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFacilityRequest | UpdateFacilityRequest) => Promise<void>;
  initialData?: FacilityListItem | null;
  isLoading?: boolean;
}

export const FacilityModal: React.FC<FacilityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState(() => {
    const hours = parseOpeningHours(initialData?.openingHours);
    return {
      code: initialData?.code || '',
      name: initialData?.name || '',
      address: initialData?.address || '',
      phone: digitsOnlyPhone(initialData?.phone),
      openTime: hours.openTime,
      closeTime: hours.closeTime,
      description: initialData?.description || '',
    };
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

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit) {
      const trimmedCode = formData.code.trim().toUpperCase();
      if (!trimmedCode) {
        newErrors.code = 'Mã cơ sở không được để trống';
      } else if (!FACILITY_CODE_PATTERN.test(trimmedCode)) {
        newErrors.code = FACILITY_CODE_ERROR;
      }
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên cơ sở không được để trống';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 150) {
      newErrors.name = 'Tên cơ sở phải từ 2 đến 150 ký tự';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ cơ sở không được để trống';
    } else if (formData.address.trim().length < 5 || formData.address.trim().length > 255) {
      newErrors.address = 'Địa chỉ phải từ 5 đến 255 ký tự';
    }

    const phone = formData.phone.trim();
    if (phone && !/^0\d{9}$/.test(phone)) {
      newErrors.phone = 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0';
    }

    if (!TIME_PATTERN.test(formData.openTime) || !TIME_PATTERN.test(formData.closeTime)) {
      newErrors.openingHours = 'Chọn giờ mở cửa và giờ đóng cửa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const openingHours = `${formData.openTime}–${formData.closeTime}`;

    try {
      if (isEdit) {
        await onSubmit({
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          openingHours,
          description: formData.description.trim() || undefined,
        });
      } else {
        await onSubmit({
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          address: formData.address.trim(),
          phone: formData.phone.trim() || undefined,
          openingHours,
          description: formData.description.trim() || undefined,
        });
      }
    } catch (err: unknown) {
      const errorObj = err as { errorCode?: string };
      if (errorObj.errorCode === 'FACILITY_CODE_ALREADY_EXISTS') {
        setErrors((current) => ({
          ...current,
          code: 'Mã cơ sở này đã được sử dụng, vui lòng chọn mã khác',
        }));
      }
    }
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-white">
              {isEdit ? 'Chỉnh sửa thông tin cơ sở' : 'Thêm cơ sở lưu trữ mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overflow-x-hidden space-y-4 flex-1">
          {/* Mã cơ sở */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Mã cơ sở (Code) <span className="text-rose-500">*</span>
            </label>
            {isEdit ? (
              <div className="text-sm font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5">
                {formData.code} <span className="text-xs font-normal text-slate-400 ml-2">(Mã cố định không thể sửa)</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="VD: FAC-Q7, FAC-CG"
                  maxLength={8}
                  value={formData.code}
                  onChange={(e) => {
                    const nextCode = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
                    setFormData({ ...formData, code: nextCode });
                    if (errors.code) {
                      setErrors((current) => ({ ...current, code: '' }));
                    }
                  }}
                  className={`w-full text-sm font-mono border rounded-xl px-3.5 py-2.5 outline-none transition-all ${
                    errors.code
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                  }`}
                />
              </div>
            )}
            {!isEdit && (
              <p className="mt-1 text-xs text-slate-500">{FACILITY_CODE_HINT}</p>
            )}
            {errors.code && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.code}
              </p>
            )}
          </div>

          {/* Tên cơ sở */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Tên cơ sở <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="VD: Kho Quận 1 — 123 Lê Lợi"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full text-sm border rounded-xl px-3.5 py-2.5 outline-none transition-all ${
                  errors.name
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
              </p>
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Địa chỉ chi tiết <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="VD: 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={`w-full text-sm border rounded-xl pl-10 pr-3.5 py-2.5 outline-none transition-all ${
                  errors.address
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.address}
              </p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Số điện thoại liên hệ
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="0901234567"
                value={formData.phone}
                inputMode="numeric"
                onChange={(e) => {
                  const nextPhone = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: nextPhone });
                  if (errors.phone) {
                    setErrors((current) => ({ ...current, phone: '' }));
                  }
                }}
                className={`w-full text-sm border rounded-xl pl-10 pr-3.5 py-2.5 outline-none transition-all ${
                  errors.phone
                    ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
              </p>
            )}
          </div>

          {/* Giờ hoạt động */}
          <div className="min-w-0">
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Giờ hoạt động
            </label>
            <div className="flex items-end gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 mb-1">Mở cửa</span>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="time"
                    aria-label="Giờ mở cửa"
                    value={formData.openTime}
                    onChange={(e) => {
                      setFormData({ ...formData, openTime: e.target.value });
                      if (errors.openingHours) {
                        setErrors((current) => ({ ...current, openingHours: '' }));
                      }
                    }}
                    className={`w-full min-w-0 text-sm border rounded-xl pl-9 pr-2 py-2.5 outline-none transition-all ${
                      errors.openingHours
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                    }`}
                  />
                </div>
              </div>
              <span className="pb-2.5 text-slate-400 text-sm shrink-0">–</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 mb-1">Đóng cửa</span>
                <input
                  type="time"
                  aria-label="Giờ đóng cửa"
                  value={formData.closeTime}
                  onChange={(e) => {
                    setFormData({ ...formData, closeTime: e.target.value });
                    if (errors.openingHours) {
                      setErrors((current) => ({ ...current, openingHours: '' }));
                    }
                  }}
                  className={`w-full min-w-0 text-sm border rounded-xl px-3 py-2.5 outline-none transition-all ${
                    errors.openingHours
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
                  }`}
                />
              </div>
            </div>
            {errors.openingHours && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.openingHours}
              </p>
            )}
          </div>

          {/* Mô tả cơ sở */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Mô tả & Tiện ích
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={3}
                placeholder="Ghi chú về vị trí, camera an ninh 24/7, thang máy tải hàng..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl shadow-md transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isEdit ? 'Cập nhật' : 'Tạo cơ sở'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
