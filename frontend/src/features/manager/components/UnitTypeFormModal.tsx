// frontend/src/features/manager/components/UnitTypeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { UnitTypeFormData, UnitTypeResponse } from '@/types/unit';

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
    if (!form.name.trim()) { setError('Ten loai o kho khong duoc de trong.'); return; }
    if (form.widthM <= 0 || form.depthM <= 0) { setError('Chieu rong va chieu sau phai lon hon 0.'); return; }
    if (form.monthlyPrice <= 0) { setError('Don gia phai lon hon 0.'); return; }
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(form);
      onClose();
    } catch {
      setError('Luu that bai. Vui long thu lai.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-[#0F1117] border border-[#2E3652] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] placeholder-[#8890A4] focus:outline-none focus:border-[#4F7FFA] transition-colors';
  const labelCls = 'block text-xs text-[#8890A4] mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1A1F2E] border border-[#2E3652] rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E3652]">
          <h2 className="text-base font-semibold text-[#E8EAF0]">
            {initialData ? 'Sua loai o kho' : 'Them loai o kho moi'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#8890A4] hover:text-[#E8EAF0] text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-900/30 border border-red-700 rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>
              Ten loai o kho <span className="text-red-400">*</span>
            </label>
            <input
              id="ut-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="VD: Loai S - 3m2"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Mo ta</label>
            <textarea
              id="ut-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Mo ta ngan ve cong dung cua loai o kho nay"
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { field: 'widthM' as const, label: 'Rong (m)', required: true },
                { field: 'depthM' as const, label: 'Sau (m)', required: true },
                { field: 'heightM' as const, label: 'Cao (m)', required: false },
              ]
            ).map(({ field, label, required }) => (
              <div key={field}>
                <label className={labelCls}>
                  {label} {required && <span className="text-red-400">*</span>}
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
              Don gia (VND/thang) <span className="text-red-400">*</span>
            </label>
            <input
              id="ut-price"
              type="number"
              min="0"
              step="50000"
              value={form.monthlyPrice}
              onChange={(e) => set('monthlyPrice', parseInt(e.target.value, 10))}
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-[#2E3652]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#8890A4] hover:text-[#E8EAF0] rounded-lg hover:bg-[#2E3652] transition-colors"
            >
              Huy
            </button>
            <button
              id="ut-submit"
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium bg-[#4F7FFA] text-white rounded-lg hover:bg-[#3D6AE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Dang luu...' : initialData ? 'Cap nhat' : 'Them moi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
