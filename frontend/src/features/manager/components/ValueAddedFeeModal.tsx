import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Package, Loader2 } from 'lucide-react';
import type { SurchargeItem } from '@/types';
import { fetchSurcharges } from '@/api/pricing';
import { applyCatalogFee } from '@/api/contract';
import { catalogLineAmount, feeCategoryLabel } from '@/features/pricing/feeCategory';

interface ValueAddedFeeModalProps {
  isOpen: boolean;
  contractId: number | null;
  contractCode?: string;
  facilityId?: number;
  monthlyPrice?: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const ValueAddedFeeModal: React.FC<ValueAddedFeeModalProps> = ({
  isOpen,
  contractId,
  contractCode,
  facilityId,
  monthlyPrice = 0,
  onClose,
  onSuccess,
}) => {
  const [fees, setFees] = useState<SurchargeItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId('');
    setNote('');
    setError(null);
    fetchSurcharges({ isActive: true })
      .then((list) =>
        setFees(
          list.filter(
            (fee) =>
              fee.isActive &&
              fee.category === 'VALUE_ADDED' &&
              (fee.facilityId == null || fee.facilityId === facilityId),
          ),
        ),
      )
      .catch(() => setFees([]));
  }, [isOpen, facilityId]);

  if (!isOpen || contractId == null) return null;

  const selected = fees.find((fee) => fee.id === selectedId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId === '') {
      setError('Chọn khoản tiện ích đang hiệu lực.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const saved = await applyCatalogFee(contractId, selectedId, note.trim() || undefined);
      onSuccess(`Đã ghi ${saved.name} ${saved.amount.toLocaleString('vi-VN')} đ vào ${contractCode || 'hợp đồng'}. Khoản này chờ tất toán nếu chưa thu.`);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không ghi được phụ phí.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiện ích bổ sung</h3>
              <p className="text-[11px] text-slate-500">{contractCode} · {feeCategoryLabel('VALUE_ADDED')}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {error && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{error}</p>}
          {fees.length === 0 ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Chưa có khoản tiện ích đang hiệu lực. Business Operations Manager niêm yết trong tab Phụ phí.
            </p>
          ) : (
            <label className="block text-xs font-semibold text-slate-700">
              Khoản đang hiệu lực
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1 w-full text-sm border border-slate-300 rounded-xl px-3 py-2"
              >
                <option value="">Chọn khoản</option>
                {fees.map((fee) => {
                  const line = catalogLineAmount(fee, monthlyPrice);
                  const price = fee.type === 'PERCENTAGE' ? `${fee.amount}% · ${line.toLocaleString('vi-VN')} đ` : `${line.toLocaleString('vi-VN')} đ`;
                  return (
                    <option key={fee.id} value={fee.id}>
                      {fee.name} — {price}
                    </option>
                  );
                })}
              </select>
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-700">
            Ghi chú
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full text-sm border border-slate-300 rounded-xl px-3 py-2"
              placeholder="Ví dụ: pallet ngày 30/09"
            />
          </label>
          {selected && (
            <p className="text-xs text-slate-600">
              Số tiền ghi nhận: {catalogLineAmount(selected, monthlyPrice).toLocaleString('vi-VN')} đ. Khách có thể trả ngay hoặc để đến lúc tất toán.
            </p>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || fees.length === 0}
            className="px-3 py-2 text-xs font-semibold text-white bg-amber-600 rounded-lg disabled:opacity-50 inline-flex items-center gap-1"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Ghi vào hợp đồng
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};
