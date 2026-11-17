import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, KeyRound, Check } from 'lucide-react';
import type { CheckInContract, CheckInSubmitRequest } from '../../../types';
import { SignaturePad } from './SignaturePad';
import { EvidencePhotoCapture } from './EvidencePhotoCapture';
export interface HandoverInspectionFormProps {
  contract: CheckInContract;
  onSubmitHandover: (request: CheckInSubmitRequest) => Promise<void>;
  onOpenRejectionModal: () => void;
  isSubmitting?: boolean;
}

export const HandoverInspectionForm: React.FC<HandoverInspectionFormProps> = ({
  contract,
  onSubmitHandover,
  onOpenRejectionModal,
  isSubmitting = false,
}) => {
  // 4 tiêu chí nghiệm thu vật lý theo BR-CHK-02
  const [criteria, setCriteria] = useState({
    cleanAndEmpty: false,
    doorWorking: false,
    dryWallsFloor: false,
    smartLockReady: false,
  });

  const [conditionNote, setConditionNote] = useState('');
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);

  const allCriteriaPassed =
    criteria.cleanAndEmpty &&
    criteria.doorWorking &&
    criteria.dryWallsFloor &&
    criteria.smartLockReady;

  const isAwaitingRelocation = Boolean(
    contract.relocationEligible ||
    contract.isAwaitingRelocation ||
    !contract.storageUnitCode ||
    contract.storageUnitCode === 'Chờ gán lại ô kho'
  );

  const hasAllocatedUnit = Boolean(
    !isAwaitingRelocation &&
    contract.storageUnitId &&
    contract.storageUnitCode &&
    contract.storageUnitCode !== 'Chưa chọn ô'
  );

  const canSubmit =
    !isAwaitingRelocation &&
    hasAllocatedUnit &&
    allCriteriaPassed &&
    customerConfirmed &&
    !!signatureDataUrl &&
    contract.isFullyPaid &&
    !isSubmitting;

  // Nút nhanh: chọn tất cả đạt chuẩn
  const handleSelectAllCriteria = () => {
    setCriteria({
      cleanAndEmpty: true,
      doorWorking: true,
      dryWallsFloor: true,
      smartLockReady: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const request: CheckInSubmitRequest = {
      checkinDate: new Date().toISOString().split('T')[0],
      conditionNote: conditionNote || 'Mặt bằng ô kho hoàn toàn đạt chuẩn nghiệm thu lúc bàn giao.',
      customerConfirmed: true,
      notes: `Nhân viên tiếp đón trực tiếp tại cơ sở. Ô kho ${contract.storageUnitCode}.`,
      signatureDataUrl: signatureDataUrl || undefined,
      inspectionCriteria: criteria,
    };

    await onSubmitHandover(request);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="p-6 space-y-6">
        {/* Tiêu đề mục */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Biên Bản Nghiệm Thu & Bàn Giao Điện Tử</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tiêu chuẩn kiểm định và bàn giao cơ sở lưu trữ</p>
          </div>

          <button
            type="button"
            onClick={handleSelectAllCriteria}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors cursor-pointer"
          >
            Chọn tất cả đạt chuẩn
          </button>
        </div>

        {/* Cảnh báo sự cố (Viền trái đậm, nền vàng nhạt) */}
        {isAwaitingRelocation ? (
          <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <p className="font-bold text-amber-900">Ô kho phát sinh sự cố — Tạm dừng thủ tục bàn giao.</p>
              <p className="text-amber-800/90 mt-0.5">
                Khách hàng đã báo sự cố hư hỏng và yêu cầu đổi ô kho mới. Hồ sơ đã được chuyển tiếp đến Quản lý cơ sở (FM) để phân bổ ô kho thay thế trên sơ đồ mặt bằng 2D. Sau khi Quản lý cơ sở cấp ô mới xong, màn hình sẽ tự động cập nhật để bạn tiếp tục bàn giao cho khách.
              </p>
            </div>
          </div>
        ) : !hasAllocatedUnit ? (
          <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
              Hợp đồng chưa được Quản lý cơ sở phân bổ ô kho cụ thể. Vui lòng liên hệ Quản lý cơ sở gán ô kho trước khi tiến hành nghiệm thu bàn giao.
            </p>
          </div>
        ) : null}

        {/* 1. 4 Tiêu chí kiểm tra hiện trạng */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            1. Kiểm tra 4 tiêu chí hiện trạng vật lý (Bắt buộc)
          </label>

          <div className="space-y-2.5">
            {([
              ['cleanAndEmpty', 'Kho sạch sẽ & trống hoàn toàn', 'Không có rác thải, bụi bẩn hoặc đồ đạc cũ của khách trước'],
              ['doorWorking', 'Cửa cuốn kéo êm, không kẹt', 'Khóa cơ và thanh ray hoạt động trơn tru, không móp méo'],
              ['dryWallsFloor', 'Sàn và vách ngăn khô ráo', 'Không có vết thấm dột, trần kho nguyên vẹn, đạt chuẩn an toàn'],
              ['smartLockReady', 'Hệ thống khóa thông minh sẵn sàng', 'Đèn hành lang sáng tốt, bàn phím số thông minh hoạt động bình thường'],
            ] as const).map(([key, title, help]) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={criteria[key]}
                  onChange={() => setCriteria((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="mt-1 w-4 h-4 accent-brand-600 rounded"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-brand-700 transition-colors">{title}</span>
                  <span className="block text-xs text-gray-500">{help}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 2. Ghi chú hiện trạng */}
        <div className="space-y-2 pt-5 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            2. Ghi chú hiện trạng tại chỗ (Tùy chọn)
          </label>
          <textarea
            rows={2}
            value={conditionNote}
            onChange={(e) => setConditionNote(e.target.value)}
            placeholder="Ví dụ: Ô kho mới sơn lại, sàn sạch bóng, bàn giao kèm 01 chìa khóa cơ dự phòng..."
            className="w-full text-sm p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-gray-800 placeholder:text-gray-400"
          />
        </div>

        {/* 3. Ảnh chụp hiện trạng */}
        <div className="pt-5 border-t border-gray-100">
          <EvidencePhotoCapture
            photos={attachedPhotos}
            onChange={setAttachedPhotos}
            maxPhotos={3}
            label="3. Ảnh chụp hiện trạng bàn giao kho (Tùy chọn)"
            helperText="Chụp trực tiếp bằng camera hoặc tải ảnh từ thiết bị"
          />
        </div>

        {/* 4. Khung ký số điện tử */}
        <div className="space-y-2.5 pt-5 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
            4. Chữ ký xác nhận của khách hàng
          </label>

          <SignaturePad onSignatureChange={setSignatureDataUrl} />
        </div>
      </div>

      {/* Footer: Checkbox pháp lý đặt sát ngay trên 2 nút hành động */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={customerConfirmed}
            onChange={(e) => setCustomerConfirmed(e.target.checked)}
            className="sr-only"
          />
          <span
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
              customerConfirmed
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-gray-300 bg-white'
            }`}
          >
            {customerConfirmed && <Check className="w-3 h-3 stroke-[3]" />}
          </span>
          <span className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
            Khách hàng <strong className="text-gray-900">{contract.customerName}</strong> đã cùng nhân viên kiểm tra thực tế và xác nhận đồng ý nhận bàn giao ô kho theo đúng biên bản.
          </span>
        </label>

        {/* Thanh 2 nút thao tác */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Trạng thái chờ đổi ô kho (Info xanh dương nhạt) hoặc Nút báo sự cố Outline Red */}
          {isAwaitingRelocation ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Đã ghi nhận sự cố & chờ Quản lý đổi ô kho</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenRejectionModal}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-600 bg-white border border-rose-300 hover:bg-rose-50 hover:border-rose-400 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>Báo hỏng / Khách từ chối nhận</span>
            </button>
          )}

          {/* Nút xác nhận chính */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-colors disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <KeyRound className="w-4 h-4 mr-2 shrink-0" />
            {isSubmitting ? 'Đang tải...' : 'XÁC NHẬN BÀN GIAO & KÍCH HOẠT MÃ PIN'}
          </button>
        </div>
      </div>
    </form>
  );
};
