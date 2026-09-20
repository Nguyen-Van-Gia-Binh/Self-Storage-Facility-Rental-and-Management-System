import React, { useState } from 'react';
import { ClipboardCheck, CheckSquare, Square, Camera, AlertOctagon, KeyRound, Sparkles, Check } from 'lucide-react';
import type { CheckInContract, CheckInSubmitRequest } from '../../../types';
import { SignaturePad } from './SignaturePad';
import { Button } from '../../../components/ui/Button';

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
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);

  const allCriteriaPassed =
    criteria.cleanAndEmpty &&
    criteria.doorWorking &&
    criteria.dryWallsFloor &&
    criteria.smartLockReady;

  const canSubmit =
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

  // Nút nhanh: Tải ảnh mẫu hiện trường kho sạch
  const handleAddSamplePhoto = () => {
    // Ảnh mẫu mặt bằng kho sạch (kho mini hiện đại)
    setAttachedPhoto('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80');
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
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Biên Bản Nghiệm Thu & Bàn Giao Điện Tử</h3>
            <p className="text-xs text-slate-500">Quy chuẩn bàn giao cơ sở theo BR-CHK-02 và BR-CHK-03</p>
          </div>
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

      {/* 4 Tiêu chí kiểm tra hiện trạng */}
      <div className="space-y-2.5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          1. Kiểm tra 4 tiêu chí hiện trạng vật lý (Bắt buộc)
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {/* Tiêu chí 1 */}
          <div
            onClick={() => setCriteria((prev) => ({ ...prev, cleanAndEmpty: !prev.cleanAndEmpty }))}
            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              criteria.cleanAndEmpty
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
            }`}
          >
            {criteria.cleanAndEmpty ? (
              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block">Kho sạch sẽ & trống hoàn toàn</span>
              <span className="text-slate-500">Không có rác thải, bụi bẩn hoặc đồ đạc cũ của khách trước</span>
            </div>
          </div>

          {/* Tiêu chí 2 */}
          <div
            onClick={() => setCriteria((prev) => ({ ...prev, doorWorking: !prev.doorWorking }))}
            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              criteria.doorWorking
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
            }`}
          >
            {criteria.doorWorking ? (
              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block">Cửa cuốn kéo êm, không kẹt</span>
              <span className="text-slate-500">Khóa cơ và thanh ray hoạt động trơn tru, không móp méo</span>
            </div>
          </div>

          {/* Tiêu chí 3 */}
          <div
            onClick={() => setCriteria((prev) => ({ ...prev, dryWallsFloor: !prev.dryWallsFloor }))}
            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              criteria.dryWallsFloor
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
            }`}
          >
            {criteria.dryWallsFloor ? (
              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block">Sàn và vách ngăn khô ráo</span>
              <span className="text-slate-500">Không có vết thấm dột, trần kho nguyên vẹn, đạt chuẩn an toàn</span>
            </div>
          </div>

          {/* Tiêu chí 4 */}
          <div
            onClick={() => setCriteria((prev) => ({ ...prev, smartLockReady: !prev.smartLockReady }))}
            className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
              criteria.smartLockReady
                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 text-slate-700'
            }`}
          >
            {criteria.smartLockReady ? (
              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block">Hệ thống khóa thông minh sẵn sàng</span>
              <span className="text-slate-500">Đèn hành lang sáng tốt, bàn phím số IoT hoạt động bình thường</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ghi chú & Đính kèm ảnh thực tế */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Ghi chú hiện trạng tại chỗ (Tùy chọn)
          </label>
          <textarea
            rows={3}
            value={conditionNote}
            onChange={(e) => setConditionNote(e.target.value)}
            placeholder="Ví dụ: Ô kho mới sơn lại, sàn sạch bóng, bàn giao kèm 01 chìa khóa cơ dự phòng..."
            className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ảnh hiện trạng kho
          </label>
          {attachedPhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 h-24 group">
              <img
                src={attachedPhoto}
                alt="Ảnh hiện trạng ô kho"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setAttachedPhoto(null)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-[10px] hover:bg-red-600 transition-colors"
              >
                Xóa
              </button>
              <span className="absolute bottom-1 left-1.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                Đã đính kèm ảnh
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddSamplePhoto}
              className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500 hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5 text-slate-400" />
              <span>Chụp / Tải ảnh kho</span>
              <span className="text-[10px] text-brand-600 font-semibold">(Bấm để thêm ảnh mẫu)</span>
            </button>
          )}
        </div>
      </div>

      {/* Khung ký số điện tử (BR-CHK-03) */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          3. Chữ ký số xác nhận của khách hàng (BR-CHK-03)
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

      {/* Action Buttons Bar */}
      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Nút báo sự cố ngoại lệ (BR-CHK-06) */}
        <button
          type="button"
          onClick={onOpenRejectionModal}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer"
        >
          <AlertOctagon className="w-4 h-4" />
          Báo hỏng / Khách từ chối nhận
        </button>

        {/* Nhóm nút chính */}
        <div className="flex items-center gap-3">
          {!canSubmit && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {!allCriteriaPassed
                ? 'Cần tích đủ 4 tiêu chí'
                : !signatureDataUrl
                ? 'Cần có chữ ký khách'
                : !customerConfirmed
                ? 'Cần tích đồng ý'
                : 'Chưa đủ điều kiện'}
            </span>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            isLoading={isSubmitting}
            size="md"
            variant="primary"
            className="px-6 py-2.5 shadow-sm cursor-pointer"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            BÀN GIAO & CẤP MÃ PIN
          </Button>
        </div>
      </div>
    </form>
  );
};
