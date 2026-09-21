// frontend/src/features/bom/components/FacilityModal.tsx
import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Clock, FileText, Loader2, AlertCircle } from 'lucide-react';
import type { FacilityListItem, CreateFacilityRequest, UpdateFacilityRequest } from '@/types';

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

  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    openingHours: initialData?.openingHours || '06:00–22:00',
    description: initialData?.description || '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Tên cơ sở không được để trống';
    } else if (formData.name.trim().length < 2 || formData.name.trim().length > 200) {
      newErrors.name = 'Tên cơ sở phải từ 2 đến 200 ký tự';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ cơ sở không được để trống';
    } else if (formData.address.trim().length < 10 || formData.address.trim().length > 500) {
      newErrors.address = 'Địa chỉ phải từ 10 đến 500 ký tự';
    }

    if (formData.phone && !/^[0-9+\s\-()]{7,20}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không đúng định dạng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit({
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim() || undefined,
      openingHours: formData.openingHours.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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

          {/* Điện thoại & Giờ mở cửa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="028-1234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Giờ hoạt động
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="06:00–22:00"
                  value={formData.openingHours}
                  onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
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
    </div>
  );
};
