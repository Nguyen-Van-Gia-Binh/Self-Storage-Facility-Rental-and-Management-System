// frontend/src/features/manager/components/StorageUnitFormModal.tsx
import React, { useState, useEffect } from 'react';
import type { StorageUnitFormData, UnitTypeResponse } from '@/types/unit';
import { X, Box } from 'lucide-react';

interface StorageUnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StorageUnitFormData) => Promise<void>;
  unitTypes: UnitTypeResponse[];
  defaultUnitTypeId?: number;
}

export const StorageUnitFormModal: React.FC<StorageUnitFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  unitTypes,
  defaultUnitTypeId,
}) => {
  const [form, setForm] = useState<StorageUnitFormData>({
    unitTypeId: 0,
    code: '',
    floor: 1,
    position: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        unitTypeId: defaultUnitTypeId ?? (unitTypes[0]?.id ?? 0),
        code: '',
        floor: 1,
        position: '',
      });
      setError(null);
    }
  }, [isOpen, defaultUnitTypeId, unitTypes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { setError('Mã ô kho không được để trống.'); return; }
    if (!form.position.trim()) { setError('Vị trí ô kho không được để trống.'); return; }
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(form);
      onClose();
    } catch {
      setError('Thêm ô kho thất bại. Mã ô kho có thể đã tồn tại trong cơ sở.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
              <Box className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Thêm ô kho vật lý mới</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div>
            <label className={labelCls}>
              Loại ô kho tương ứng <span className="text-rose-500">*</span>
            </label>
            <select
              id="su-unit-type"
              value={form.unitTypeId}
              onChange={(e) =>
                setForm((p) => ({ ...p, unitTypeId: parseInt(e.target.value, 10) }))
              }
              className={`${inputCls} cursor-pointer`}
            >
              {unitTypes
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.areaM2}m²)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>
              Mã ô kho vật lý <span className="text-rose-500">*</span>
            </label>
            <input
              id="su-code"
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
              }
              placeholder="VD: S-101, M-202"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Tầng <span className="text-rose-500">*</span>
              </label>
              <input
                id="su-floor"
                type="number"
                min="1"
                value={form.floor}
                onChange={(e) =>
                  setForm((p) => ({ ...p, floor: parseInt(e.target.value, 10) }))
                }
                className={`${inputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>
                Vị trí dãy / Dãy kho <span className="text-rose-500">*</span>
              </label>
              <input
                id="su-position"
                type="text"
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value.toUpperCase() }))
                }
                placeholder="VD: A1, B2"
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              id="su-submit"
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold bg-brand-500 text-white rounded-xl hover:bg-brand-600 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {submitting ? 'Đang thêm...' : 'Thêm ô kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
