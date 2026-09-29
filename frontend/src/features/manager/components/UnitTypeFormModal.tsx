// frontend/src/features/manager/components/UnitTypeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UnitTypeFormData, UnitTypeResponse } from '@/types/unit';
import { X, Layers, Snowflake, Package } from 'lucide-react';
import { tokenStorage } from '@/utils/tokenStorage';

interface UnitTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UnitTypeFormData) => Promise<void>;
  initialData?: UnitTypeResponse | null;
}

const empty: UnitTypeFormData = {
  name: '',
  description: '',
  widthM: 0,
  depthM: 0,
  heightM: 2.5,
  monthlyPrice: 0,
};

export const UnitTypeFormModal: React.FC<UnitTypeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [form, setForm] = useState<UnitTypeFormData>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FM (MANAGER) không được phép nhập giá - chỉ BOM mới được định giá (BR-GEN-01)
  const userRole = tokenStorage.getUser()?.role;
  const isManager = userRole === 'MANAGER';
  const canSetPrice = !isManager; // BOM, ADMIN mới được nhập giá

  const isClimate =
    form.name.toLowerCase().includes('lạnh') ||
    form.name.toLowerCase().includes('máy lạnh') ||
    form.name.toLowerCase().includes('điều hòa') ||
    (form.code || '').toUpperCase().includes('CLIMATE');

  useEffect(() => {
    if (isOpen) {
      setForm(
        initialData
          ? {
              name: initialData.name,
              description: initialData.description,
              widthM: initialData.widthM,
              depthM: initialData.depthM,
              heightM: initialData.heightM,
              monthlyPrice: initialData.monthlyPrice,
            }
          : empty
      );
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const set = (f: keyof UnitTypeFormData, v: string | number) =>
    setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Tên loại ô kho không được để trống.'); return; }
    if (form.widthM <= 0 || form.depthM <= 0) { setError('Chiều rộng và chiều sâu phải lớn hơn 0.'); return; }
    if (canSetPrice && form.monthlyPrice <= 0) {
      setError('Đơn giá niêm yết phải lớn hơn 0.'); return;
    }
    // FM chỉ gửi thông số kỹ thuật, không gửi giá (BR-GEN-01)
    const submitData: UnitTypeFormData = canSetPrice
      ? form
      : { ...form, monthlyPrice: 0 };
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(submitData);
      onClose();
    } catch {
      setError('Lưu thông tin thất bại. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {initialData ? 'Chỉnh sửa loại ô kho' : 'Thêm loại ô kho mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="unit-type-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          {/* Chọn loại môi trường bảo quản */}
          <div>
            <label className={labelCls}>Môi trường nhiệt độ & bảo quản</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (form.name.includes('Máy Lạnh') || form.name.includes('Kho Lạnh')) {
                    set('name', form.name.replace(/Kho Máy Lạnh|Kho Lạnh|Máy Lạnh/gi, 'Kho Tiêu Chuẩn').trim());
                  }
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  !isClimate
                    ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Package className={`w-4 h-4 mt-0.5 shrink-0 ${!isClimate ? 'text-brand-600' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Kho Tiêu Chuẩn</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Nhiệt độ phòng tự nhiên</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!form.name || form.name.includes('Loại S') || form.name.includes('Tiêu Chuẩn')) {
                    set('name', 'Kho Máy Lạnh (Climate Unit)');
                  } else if (!form.name.includes('Máy Lạnh') && !form.name.includes('Lạnh')) {
                    set('name', `Kho Máy Lạnh — ${form.name}`);
                  }
                  if (!form.description) {
                    set('description', 'Điều hòa nhiệt độ 22°C - 25°C & kiểm soát độ ẩm 24/7, phù hợp đồ da, rượu vang, thiết bị điện tử.');
                  }
                }}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                  isClimate
                    ? 'border-cyan-500 bg-cyan-50/60 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <Snowflake className={`w-4 h-4 mt-0.5 shrink-0 ${isClimate ? 'text-cyan-600' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Kho Máy Lạnh ❄️</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">22°C - 25°C & độ ẩm 24/7</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Tên loại ô kho <span className="text-rose-500">*</span>
            </label>
            <input
              id="ut-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="VD: Loại S — 3m² hoặc Kho Máy Lạnh — 5m²"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Mô tả công năng</label>
            <textarea
              id="ut-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Mô tả gợi ý đồ đạc phù hợp để lưu trữ trong loại kho này..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { field: 'widthM' as const, label: 'Rộng (m)', required: true },
              { field: 'depthM' as const, label: 'Sâu (m)', required: true },
              { field: 'heightM' as const, label: 'Cao (m)', required: false },
            ].map(({ field, label, required }) => (
              <div key={field}>
                <label className={labelCls}>
                  {label} {required && <span className="text-rose-500">*</span>}
                </label>
                <input
                  id={`ut-${field}`}
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form[field]}
                  onChange={(e) => set(field, parseFloat(e.target.value))}
                  className={`${inputCls} font-mono`}
                />
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls}>
              Đơn giá niêm yết (VND/tháng) <span className="text-rose-500">*</span>
            </label>
            {isManager ? (
              <div className="px-3.5 py-2 text-sm text-slate-400 italic bg-slate-100 border border-slate-200 rounded-xl">
                Chỉ BOM mới được nhập giá niêm yết
              </div>
            ) : (
              <input
                id="ut-price"
                type="number"
                min="0"
                step="50000"
                value={form.monthlyPrice}
                onChange={(e) => set('monthlyPrice', parseInt(e.target.value, 10))}
                className={`${inputCls} font-mono`}
              />
            )}
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            form="unit-type-form"
            id="ut-submit"
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-brand-500 text-white rounded-xl hover:bg-brand-600 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
