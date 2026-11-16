import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, AlertCircle, CheckCircle, ArrowRight, MapPin } from 'lucide-react';
import type { ManagerContractItem, AvailableUnitOption } from '@/types/contractManager';
import { getAvailableUnitsForReassign, reassignStorageUnit } from '@/api/contract';
import { FacilityFloorPlanMapModal } from './FacilityFloorPlanMapModal';

interface ReassignUnitModalProps {
  isOpen: boolean;
  contract: ManagerContractItem | null;
  onClose: () => void;
  onSuccess: (updatedContract: ManagerContractItem, message: string) => void;
}

const COMMON_REASONS = [
  'Cửa cuốn bị kẹt hoặc hỏng khóa phụ, không sửa tại chỗ được',
  'Phát hiện vết ẩm mốc/thấm trần trên ô đã chọn',
  'Hệ thống chiếu sáng hoặc cảm biến an ninh tại ô kho gặp sự cố',
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
  const [customerConsent, setCustomerConsent] = useState(false);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);

  const needsConsent = contract?.status === 'PENDING_CHECK_IN';

  useEffect(() => {
    if (isOpen && contract) {
      setFetchingUnits(true);
      setError(null);
      setSelectedUnitId(null);
      setCustomerConsent(false);
      setReason(COMMON_REASONS[0]);
      setCustomReason('');
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
    if (!contract.openSupportRequestId) {
      setError('Hợp đồng này chưa có phiếu hư hỏng ô kho đang mở.');
      return;
    }
    if (needsConsent && !customerConsent) {
      setError('Cần ghi nhận khách đã đồng ý đổi ô trước khi nhận kho.');
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
        supportRequestId: contract.openSupportRequestId ?? undefined,
        customerConsent: needsConsent ? customerConsent : undefined,
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
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base text-slate-900">Đổi ô kho vì sự cố</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chỉ ô cùng loại. Giá thuê và tiền cọc trên hợp đồng giữ nguyên.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Thông tin đơn hiện tại */}
          <div className="text-sm space-y-3">
            <div className="grid grid-cols-2 gap-3 text-slate-600">
              <p><span className="text-slate-500">Mã hợp đồng:</span> <span className="font-medium text-slate-900">{contract.code}</span></p>
              <p><span className="text-slate-500">Khách hàng:</span> <span className="font-medium text-slate-900">{contract.customerName}</span></p>
              <p className="col-span-2"><span className="text-slate-500">Loại ô kho:</span> <span className="font-medium text-slate-900">{contract.unitTypeName}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-sm font-medium text-slate-600 font-mono">
                {contract.storageUnitCode}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="px-3 py-1 bg-brand-50 border border-brand-200 rounded text-sm font-bold text-brand-700 font-mono">
                {availableUnits.find((u) => u.id === selectedUnitId)?.code || '---'}
              </span>
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
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-slate-800 leading-snug">
                1. Chọn ô trống cùng loại
                <span className="block mt-0.5 text-xs font-normal text-slate-500">
                  {availableUnits.length} ô khả dụng
                </span>
              </p>
              <button
                type="button"
                onClick={() => setFloorPlanOpen(true)}
                className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg border border-brand-200 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Chọn trên Sơ đồ 2D</span>
              </button>
            </div>

            {fetchingUnits ? (
              <div className="p-6 text-center text-slate-400 text-xs animate-pulse">
                Đang tìm ô kho trống khả dụng...
              </div>
            ) : availableUnits.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm leading-relaxed text-amber-900 space-y-1">
                <p>Không còn ô cùng loại ({contract.unitTypeName}).</p>
                <p>
                  {contract.status === 'PENDING_CHECK_IN'
                    ? 'Khách có thể hủy đặt chỗ để được hoàn 100% tiền thuê và tiền cọc.'
                    : 'Khách cần trả kho rồi đặt hợp đồng mới. Hợp đồng này không được nâng loại kho.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto scrollbar-none pr-1">
                {availableUnits.map((unit) => {
                  const isSelected = selectedUnitId === unit.id;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => setSelectedUnitId(unit.id)}
                      className={`h-20 p-3 rounded-lg border text-left text-xs cursor-pointer transition-colors flex flex-col justify-between ${
                        isSelected
                          ? 'bg-brand-50/40 border-2 border-brand-500 text-slate-900'
                          : 'bg-white border-slate-200 hover:border-brand-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {unit.code}
                        </span>
                        {isSelected && <CheckCircle className="w-4 h-4 text-brand-600" />}
                      </div>
                      <span className="text-[11px] text-slate-500">Tầng {unit.floor} • {unit.position}</span>
                    </button>
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
                    className="mt-0.5 accent-brand-600"
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
                    className="mt-0.5 accent-brand-600"
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
                className="mt-2 w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 outline-none"
              />
            )}
          </div>

          {needsConsent && (
            <label className="flex items-start gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={customerConsent}
                onChange={(e) => setCustomerConsent(e.target.checked)}
                className="mt-0.5 accent-brand-600"
              />
              <span>Khách đã đồng ý đổi sang ô kho này (hoặc nhận nâng hạng đền bù). Không đồng ý thì khách có thể hủy để được hoàn tiền 100%.</span>
            </label>
          )}
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
            disabled={loading || availableUnits.length === 0 || (needsConsent && !customerConsent)}
            className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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

      {floorPlanOpen && (
        <FacilityFloorPlanMapModal
          isOpen={floorPlanOpen}
          onClose={() => setFloorPlanOpen(false)}
          facilityId={contract.facilityId}
          facilityName={contract.facilityName}
          allowedUnitTypeId={contract.unitTypeId}
          targetUnitTypeName={contract.unitTypeName}
          highlightUnitId={contract.storageUnitId}
          onSelectUnit={(unit) => {
            setSelectedUnitId(unit.id);
            setFloorPlanOpen(false);
          }}
        />
      )}
    </div>,
    document.body
  );
};
