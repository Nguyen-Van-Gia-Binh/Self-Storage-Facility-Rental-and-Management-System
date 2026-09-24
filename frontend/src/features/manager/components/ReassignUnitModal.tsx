import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import type { ManagerContractItem, AvailableUnitOption } from '@/types/contractManager';
import { getAvailableUnitsForReassign, reassignStorageUnit } from '@/api/contract';

interface ReassignUnitModalProps {
  isOpen: boolean;
  contract: ManagerContractItem | null;
  onClose: () => void;
  onSuccess: (updatedContract: ManagerContractItem, message: string) => void;
}

const COMMON_REASONS = [
  'Cửa cuốn bị kẹt hoặc hỏng khóa phụ cần bảo trì khẩn cấp',
  'Phát hiện vết ẩm mốc/thấm trần khi kiểm tra trước bàn giao',
  'Hệ thống chiếu sáng hoặc cảm biến an ninh tại ô kho gặp sự cố',
  'Khách hàng đề nghị đổi vị trí ô kho cùng diện tích gần lối đi chính',
];

export const ReassignUnitModal: React.FC<ReassignUnitModalProps> = ({
  isOpen,
  contract,
  onClose,
  onSuccess,
}) => {
  const [availableUnits, setAvailableUnits] = useState<AvailableUnitOption[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [reason, setReason] = useState<string>(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingUnits, setFetchingUnits] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && contract) {
      setFetchingUnits(true);
      setError(null);
      setSelectedUnitId(null);
      getAvailableUnitsForReassign(contract.facilityId, contract.unitTypeId)
        .then((units) => {
          setAvailableUnits(units);
          if (units.length > 0) {
            setSelectedUnitId(units[0].id);
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Không thể tải danh sách ô kho trống thay thế.');
        })
        .finally(() => {
          setFetchingUnits(false);
        });
    }
  }, [isOpen, contract]);

  if (!isOpen || !contract) return null;

  const handleConfirm = async () => {
    if (!selectedUnitId) {
      setError('Vui lòng chọn một ô kho thay thế còn trống.');
      return;
    }

    const chosenUnit = availableUnits.find((u) => u.id === selectedUnitId);
    if (!chosenUnit) return;

    const finalReason = reason === 'Khác' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Vui lòng nhập lý do đổi ô kho.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await reassignStorageUnit({
        contractId: contract.id,
        currentUnitId: contract.storageUnitId,
        newUnitId: chosenUnit.id,
        newUnitCode: chosenUnit.code,
        reason: finalReason,
      });

      onSuccess(result.updatedContract, result.message);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi đổi ô kho.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-white/90" />
            <div>
              <h3 className="font-bold text-base">Đổi ô kho ngoại lệ (SCR-FM-02.2)</h3>
              <p className="text-xs text-white/80">
                Xử lý điều phối khi ô kho gặp sự cố kỹ thuật hoặc bảo trì đột xuất
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Thông tin đơn hiện tại */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span>Mã hợp đồng / Đơn:</span>
              <span className="font-semibold text-slate-900">{contract.code}</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Khách hàng:</span>
              <span className="font-medium text-slate-900">{contract.customerName} ({contract.customerPhone})</span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Loại ô kho:</span>
              <span className="font-medium text-amber-700">{contract.unitTypeName}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
              <div className="text-rose-600 font-semibold flex items-center gap-1.5">
                <span>Ô kho hiện tại:</span>
                <span className="px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-700 font-mono">
                  {contract.storageUnitCode}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <div className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <span>Ô kho mới:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono">
                  {availableUnits.find((u) => u.id === selectedUnitId)?.code || '---'}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn ô kho trống cùng loại */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              1. Chọn ô kho trống thay thế cùng loại ({availableUnits.length} ô khả dụng)
            </label>

            {fetchingUnits ? (
              <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
                Đang tìm ô kho trống khả dụng...
              </div>
            ) : availableUnits.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                Hiện tại cơ sở này không còn ô kho nào cùng loại ({contract.unitTypeName}) ở trạng thái trống. Vui lòng liên hệ bộ phận vận hành hoặc hỗ trợ khách đổi sang loại kho khác.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                {availableUnits.map((unit) => {
                  const isSelected = selectedUnitId === unit.id;
                  return (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnitId(unit.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 text-emerald-900 font-medium'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {unit.code}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500">Tầng {unit.floor} • {unit.position}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chọn lý do đổi */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              2. Lý do đổi ô kho ngoại lệ
            </label>
            <div className="space-y-1.5">
              {COMMON_REASONS.map((r, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                >
                  <input
                    type="radio"
                    name="reassign_reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
              <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
                <input
                  type="radio"
                  name="reassign_reason"
                  checked={reason === 'Khác'}
                  onChange={() => setReason('Khác')}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <span>Lý do khác...</span>
              </label>
            </div>

            {reason === 'Khác' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập chi tiết lý do đổi ô kho cho hợp đồng này..."
                rows={2}
                className="mt-2 w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-300 hover:bg-white transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || availableUnits.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                Xác nhận đổi ô kho
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
