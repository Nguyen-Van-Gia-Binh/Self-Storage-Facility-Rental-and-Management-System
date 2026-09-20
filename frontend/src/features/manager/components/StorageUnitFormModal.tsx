// frontend/src/features/manager/components/StorageUnitFormModal.tsx
import React, { useState, useEffect } from 'react';
import type { StorageUnitFormData, UnitTypeResponse } from '@/types/unit';

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!form.code.trim()) { setError('Ma o kho khong duoc de trong.'); return; }
    if (!form.position.trim()) { setError('Vi tri khong duoc de trong.'); return; }
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(form);
      onClose();
    } catch {
      setError('Them o kho that bai. Ma o kho co the da ton tai.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-[#0F1117] border border-[#2E3652] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] placeholder-[#8890A4] focus:outline-none focus:border-[#4F7FFA] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1A1F2E] border border-[#2E3652] rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2E3652]">
          <h2 className="text-base font-semibold text-[#E8EAF0]">Them o kho vat ly</h2>
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
            <label className="block text-xs text-[#8890A4] mb-1">
              Loai o kho <span className="text-red-400">*</span>
            </label>
            <select
              id="su-unit-type"
              value={form.unitTypeId}
              onChange={(e) =>
                setForm((p) => ({ ...p, unitTypeId: parseInt(e.target.value, 10) }))
              }
              className={inputCls}
            >
              {unitTypes
                .filter((t) => t.isActive)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#8890A4] mb-1">
              Ma o kho <span className="text-red-400">*</span>
            </label>
            <input
              id="su-code"
              type="text"
              value={form.code}
              onChange={(e) =>
                setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
              }
              placeholder="VD: S-101"
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#8890A4] mb-1">
                Tang <span className="text-red-400">*</span>
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
              <label className="block text-xs text-[#8890A4] mb-1">
                Vi tri <span className="text-red-400">*</span>
              </label>
              <input
                id="su-position"
                type="text"
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value.toUpperCase() }))
                }
                placeholder="VD: A1"
                className={`${inputCls} font-mono`}
              />
            </div>
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
              id="su-submit"
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium bg-[#4F7FFA] text-white rounded-lg hover:bg-[#3D6AE8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Dang them...' : 'Them o kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
