import React, { useState } from 'react';
import { AlertOctagon, KeyRound, Sparkles, Check } from 'lucide-react';
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
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-6">
      {/* Tiêu đề mục */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-base text-slate-900">Biên Bản Nghiệm Thu & Bàn Giao Điện Tử</h3>
          <p className="text-xs text-slate-500">Tiêu chuẩn kiểm định và bàn giao cơ sở lưu trữ</p>
        </div>

        <button
          type="button"
          onClick={handleSelectAllCriteria}
          className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          Chọn tất cả đạt chuẩn (4/4)
        </button>
      </div>

      {/* Cảnh báo sự cố đang chờ FM phân bổ ô mới trên 2D */}
      {isAwaitingRelocation ? (
        <p className="text-sm text-amber-800">
          <span className="font-semibold text-amber-950">Ô kho phát sinh sự cố — Tạm dừng thủ tục bàn giao. </span>
          Khách hàng đã báo sự cố hư hỏng và yêu cầu đổi ô kho mới. Hồ sơ đã được chuyển tiếp đến Quản lý cơ sở (FM) để phân bổ ô kho thay thế trên sơ đồ mặt bằng 2D. Sau khi Quản lý cơ sở cấp ô mới xong, màn hình sẽ tự động cập nhật để bạn tiếp tục bàn giao cho khách.
        </p>
      ) : !hasAllocatedUnit ? (
        <p className="text-sm text-amber-800">
          Hợp đồng chưa được Quản lý cơ sở phân bổ ô kho cụ thể. Vui lòng liên hệ Quản lý cơ sở gán ô kho trước khi tiến hành nghiệm thu bàn giao theo quy định BR-CHK-02.
        </p>
      ) : null}

      {/* 4 Tiêu chí kiểm tra hiện trạng */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          1. Kiểm tra 4 tiêu chí hiện trạng vật lý (Bắt buộc)
        </label>

        <div className="space-y-3">
          {([
            ['cleanAndEmpty', 'Kho sạch sẽ & trống hoàn toàn', 'Không có rác thải, bụi bẩn hoặc đồ đạc cũ của khách trước'],
            ['doorWorking', 'Cửa cuốn kéo êm, không kẹt', 'Khóa cơ và thanh ray hoạt động trơn tru, không móp méo'],
            ['dryWallsFloor', 'Sàn và vách ngăn khô ráo', 'Không có vết thấm dột, trần kho nguyên vẹn, đạt chuẩn an toàn'],
            ['smartLockReady', 'Hệ thống khóa thông minh sẵn sàng', 'Đèn hành lang sáng tốt, bàn phím số thông minh hoạt động bình thường'],
          ] as const).map(([key, title, help]) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={criteria[key]}
                onChange={() => setCriteria((prev) => ({ ...prev, [key]: !prev[key] }))}
                className="mt-1 w-4 h-4 accent-brand-500"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">{title}</span>
                <span className="block text-sm text-slate-500">{help}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Ghi chú & Chụp ảnh thực tế bằng Camera */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Ghi chú hiện trạng tại chỗ (Tùy chọn)
          </label>
          <textarea
            rows={2}
            value={conditionNote}
            onChange={(e) => setConditionNote(e.target.value)}
            placeholder="Ví dụ: Ô kho mới sơn lại, sàn sạch bóng, bàn giao kèm 01 chìa khóa cơ dự phòng..."
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <EvidencePhotoCapture
          photos={attachedPhotos}
          onChange={setAttachedPhotos}
          maxPhotos={3}
          label="Ảnh chụp hiện trạng bàn giao kho (Tùy chọn)"
          helperText="Kích hoạt camera trước của máy tính/điện thoại để chụp trực tiếp hiện trạng bàn giao hoặc tải ảnh từ máy"
        />
      </div>

      {/* Khung ký số điện tử */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          3. Chữ ký số xác nhận của khách hàng
        </label>

        <SignaturePad onSignatureChange={setSignatureDataUrl} />

        {/* Checkbox xác nhận điều khoản */}
        <div
          onClick={() => setCustomerConfirmed(!customerConfirmed)}
          className="flex items-center gap-2.5 pt-2 cursor-pointer select-none"
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              customerConfirmed
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'border-slate-300 bg-white'
            }`}
          >
            {customerConfirmed && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className="text-xs text-slate-700 font-medium">
            Khách hàng <strong className="text-slate-900">{contract.customerName}</strong> đã cùng nhân viên kiểm tra thực tế và xác nhận đồng ý nhận bàn giao ô kho theo đúng biên bản.
          </span>
        </div>
      </div>

      {/* Thanh nút thao tác */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Nút báo sự cố ngoại lệ */}
        {isAwaitingRelocation ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-100/70 border border-amber-200 rounded-xl">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Đã ghi nhận sự cố & chờ Quản lý đổi ô kho</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onOpenRejectionModal}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>Báo hỏng / Khách từ chối nhận</span>
          </button>
        )}

        {/* Nút xác nhận chính */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <KeyRound className="w-4 h-4 mr-2 shrink-0" />
          {isSubmitting ? 'Đang tải...' : 'XÁC NHẬN BÀN GIAO & KÍCH HOẠT MÃ PIN'}
        </button>
      </div>
    </form>
  );
};
