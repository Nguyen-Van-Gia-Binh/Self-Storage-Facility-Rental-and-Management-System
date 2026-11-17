// frontend/src/features/bom/components/FacilityModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Phone, Clock, FileText, Loader2, AlertCircle, Sparkles, Lock } from 'lucide-react';
import type { FacilityListItem, CreateFacilityRequest, UpdateFacilityRequest } from '@/types';
import { generateFacilityCode } from '../utils/facilityCodeGenerator';

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
  existingCodes?: string[];
  isLoading?: boolean;
}

export const FacilityModal: React.FC<FacilityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingCodes = [],
  isLoading = false,
}) => {
  const isEdit = Boolean(initialData);

  const isInitial247 = Boolean(
    initialData?.openingHours &&
      (initialData.openingHours.includes('24/7') ||
        initialData.openingHours.includes('24h') ||
        initialData.openingHours.includes('24/24') ||
        initialData.openingHours.includes('00:00–24:00') ||
        initialData.openingHours.includes('00:00-24:00'))
  );
  const [is247, setIs247] = useState<boolean>(isInitial247);

  const [savedHours, setSavedHours] = useState(() => {
    const hours = parseOpeningHours(initialData?.openingHours);
    return isInitial247
      ? { openTime: '06:00', closeTime: '22:00' }
      : hours;
  });

  const [formData, setFormData] = useState(() => {
    const hours = parseOpeningHours(initialData?.openingHours);
    return {
      code: initialData?.code || '',
      name: initialData?.name || '',
      address: initialData?.address || '',
      phone: digitsOnlyPhone(initialData?.phone),
      openTime: isInitial247 ? '00:00' : hours.openTime,
      closeTime: isInitial247 ? '23:59' : hours.closeTime,
      description: initialData?.description || '',
    };
  });

  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [autoGenInfo, setAutoGenInfo] = useState<{ code: string; reason: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tự động sinh mã cơ sở dựa trên Tên & Địa chỉ (chỉ kích hoạt khi Thêm mới và chưa tự sửa tay)
  useEffect(() => {
    if (isEdit || isCodeManuallyEdited) return;

    if (!formData.name.trim() && !formData.address.trim()) {
      return;
    }

    const generated = generateFacilityCode(formData.name, formData.address, existingCodes);
    if (generated && generated.code) {
      setFormData((prev) => ({ ...prev, code: generated.code }));
      setAutoGenInfo(generated);
      if (errors.code) {
        setErrors((current) => ({ ...current, code: '' }));
      }
    }
  }, [formData.name, formData.address, isEdit, isCodeManuallyEdited, existingCodes]);

  const handleRegenerateCode = () => {
    const generated = generateFacilityCode(formData.name, formData.address, existingCodes);
    if (generated && generated.code) {
      setFormData((prev) => ({ ...prev, code: generated.code }));
      setAutoGenInfo(generated);
      setIsCodeManuallyEdited(false);
      if (errors.code) {
        setErrors((current) => ({ ...current, code: '' }));
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handle247Change = (next: boolean) => {
    if (next) {
      if (!(formData.openTime === '00:00' && formData.closeTime === '23:59')) {
        setSavedHours({ openTime: formData.openTime, closeTime: formData.closeTime });
      }
      setFormData((prev) => ({ ...prev, openTime: '00:00', closeTime: '23:59' }));
    } else {
      setFormData((prev) => ({
        ...prev,
        openTime: savedHours.openTime,
        closeTime: savedHours.closeTime,
      }));
    }
    setIs247(next);
    if (errors.openingHours) {
      setErrors((current) => ({ ...current, openingHours: '' }));
    }
  };

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

    if (!is247) {
      if (!TIME_PATTERN.test(formData.openTime) || !TIME_PATTERN.test(formData.closeTime)) {
        newErrors.openingHours = 'Chọn giờ mở cửa và giờ đóng cửa';
      } else if (formData.openTime === formData.closeTime) {
        newErrors.openingHours = 'Giờ mở và đóng cửa trùng nhau. Nếu cơ sở mở liên tục 24h, vui lòng tích chọn "Truy cập 24/7"';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const openingHours = is247 ? '00:00–24:00 (24/7)' : `${formData.openTime}–${formData.closeTime}`;

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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">
            {isEdit ? 'Chỉnh sửa thông tin cơ sở' : 'Thêm cơ sở lưu trữ mới'}
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto overflow-x-hidden space-y-4 flex-1">
          {/* Mã cơ sở */}
          <div>
            {isEdit ? (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <span className="text-slate-500">Mã cơ sở</span>
                <span className="font-mono font-semibold text-slate-900">{formData.code}</span>
                <Lock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span className="text-xs text-slate-500">Không thể thay đổi</span>
              </div>
            ) : (
              <>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Mã cơ sở <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="VD: FAC-Q7, FAC-CG"
                  maxLength={8}
                  value={formData.code}
                  onChange={(e) => {
                    const nextCode = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 8);
                    setFormData({ ...formData, code: nextCode });
                    setIsCodeManuallyEdited(true);
                    setAutoGenInfo(null);
                    if (errors.code) {
                      setErrors((current) => ({ ...current, code: '' }));
                    }
                  }}
                  className={`w-full text-sm font-mono border rounded-xl pl-3.5 pr-24 py-2.5 outline-none transition-all ${
                    errors.code
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  title="Tự động tính lại mã dựa trên Tên & Địa chỉ"
                  className="absolute right-2 top-2 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tự tạo</span>
                </button>
              </div>
              </>
            )}
            {!isEdit && autoGenInfo && (
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{autoGenInfo.reason}</span>
              </p>
            )}
            {!isEdit && !autoGenInfo && (
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
                    : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
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
                    : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
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
                    : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
                }`}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
              </p>
            )}
          </div>

          {/* Thời gian hoạt động */}
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
                Thời gian hoạt động
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Truy cập 24/7</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={is247}
                  aria-label="Truy cập 24/7"
                  onClick={() => handle247Change(!is247)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                    is247 ? 'bg-brand-500' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                      is247 ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-end gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500 mb-1">Mở cửa</span>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="time"
                    aria-label="Giờ mở cửa"
                    value={formData.openTime}
                    disabled={is247}
                    onChange={(e) => {
                      setFormData({ ...formData, openTime: e.target.value });
                      if (errors.openingHours) {
                        setErrors((current) => ({ ...current, openingHours: '' }));
                      }
                    }}
                    className={`w-full min-w-0 text-sm border rounded-xl pl-9 pr-2 py-2.5 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
                      errors.openingHours
                        ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
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
                  disabled={is247}
                  onChange={(e) => {
                    setFormData({ ...formData, closeTime: e.target.value });
                    if (errors.openingHours) {
                      setErrors((current) => ({ ...current, openingHours: '' }));
                    }
                  }}
                  className={`w-full min-w-0 text-sm border rounded-xl px-3 py-2.5 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
                    errors.openingHours
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
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
                className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
              />
            </div>
          </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end space-x-3">
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
              className="px-5 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition-colors flex items-center space-x-1.5 disabled:opacity-50"
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
