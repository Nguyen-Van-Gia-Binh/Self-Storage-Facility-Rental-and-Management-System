import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  AlertCircle,
  Send,
} from 'lucide-react';
import type { ReturnContractDetail, InspectionCondition, ReturnInspectionRequest, SurchargeItem } from '@/types';
import { SignaturePad } from './SignaturePad';
import { SettlementPreviewCard } from './SettlementPreviewCard';
import { fetchSurcharges } from '@/api/pricing';
import { catalogLineAmount, feeCategoryLabel } from '@/features/pricing/feeCategory';

interface ReturnInspectionFormProps {
  contract: ReturnContractDetail;
  onSubmit: (data: ReturnInspectionRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export const ReturnInspectionForm: React.FC<ReturnInspectionFormProps> = ({
  contract,
  onSubmit,
  isSubmitting = false,
}) => {
  // 3 tiêu chí cốt lõi theo US-FS-04.1 AC-1
  const [criteria, setCriteria] = useState({
    assetsCleared: true,
    wallsAndFloorIntact: true,
    lockAndHingesWorking: true,
  });

  const [condition, setCondition] = useState<InspectionCondition>('GOOD');
  const [damageNotes, setDamageNotes] = useState('');
  const [catalogFees, setCatalogFees] = useState<SurchargeItem[]>([]);
  const [selectedFeeIds, setSelectedFeeIds] = useState<number[]>([]);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [customerAgreed, setCustomerAgreed] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSurcharges({ isActive: true })
      .then((list) =>
        setCatalogFees(
          list.filter(
            (fee) =>
              fee.isActive &&
              (fee.category === 'CLEANING' || fee.category === 'DAMAGE') &&
              (fee.facilityId == null || fee.facilityId === contract.facilityId),
          ),
        ),
      )
      .catch(() => setCatalogFees([]));
  }, [contract.facilityId]);

  const selectedFees = catalogFees.filter((fee) => selectedFeeIds.includes(fee.id));
  const catalogTotal = selectedFees.reduce(
    (sum, fee) => sum + catalogLineAmount(fee, contract.monthlyPrice || 0),
    0,
  );

  const toggleFee = (feeId: number) => {
    setSelectedFeeIds((current) =>
      current.includes(feeId) ? current.filter((id) => id !== feeId) : [...current, feeId],
    );
  };

  const handleConditionChange = (newCondition: InspectionCondition) => {
    setCondition(newCondition);
    if (newCondition === 'GOOD') {
      setSelectedFeeIds([]);
      setDamageNotes('');
      setEvidenceUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Kiểm tra ràng buộc AC-3
    if (condition !== 'GOOD') {
      if (!damageNotes.trim()) {
        setErrorMessage('Vui lòng nhập mô tả hiện trường.');
        return;
      }
      if (selectedFeeIds.length === 0) {
        setErrorMessage('Chọn khoản vệ sinh hoặc bồi thường đang hiệu lực trong danh mục.');
        return;
      }
      if (!evidenceUrl.trim()) {
        setErrorMessage('Bắt buộc có ít nhất một ảnh bằng chứng.');
        return;
      }
    }

    const intactChecklist = criteria.assetsCleared && criteria.wallsAndFloorIntact && criteria.lockAndHingesWorking;
    if (condition === 'GOOD' && !intactChecklist) {
      setErrorMessage('Checklist nguyên trạng chưa đủ. Không thể chọn Đạt chuẩn khi còn mục chưa tick.');
      return;
    }

    if (!signatureData) {
      setErrorMessage('Cần chữ ký xác nhận của khách trên biên bản.');
      return;
    }

    if (!customerAgreed) {
      setErrorMessage('Khách hàng và nhân viên cần xác nhận đồng ý với biên bản kiểm tra.');
      return;
    }

    const payload: ReturnInspectionRequest = {
      returnDate: new Date().toISOString().split('T')[0],
      condition,
      damageNotes: condition !== 'GOOD' ? damageNotes : undefined,
      damageCost: 0,
      extraFeeTypeIds: condition !== 'GOOD' ? selectedFeeIds : [],
      evidenceImageUrls: condition !== 'GOOD' ? evidenceUrl : undefined,
      customerConfirmed: customerAgreed,
      signatureDataUrl: signatureData || undefined,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Checklist 3 tiêu chí theo US-FS-04.1 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-teal-600" />
          Tiêu chuẩn kiểm tra mặt bằng ô kho (Checklist)
        </h3>
        <p className="text-xs text-slate-500">
          Nhân viên trực tiếp đối soát cùng khách hàng tại hiện trường ô kho {contract.storageUnitCode}.
        </p>

        <div className="space-y-2.5 pt-2">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={criteria.assetsCleared}
              onChange={(e) => setCriteria({ ...criteria, assetsCleared: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <div className="text-sm">
              <span className="font-medium text-slate-800">
                1. Toàn bộ tài sản đã dọn sạch
              </span>
              <p className="text-xs text-slate-500">
                Khách đã mang hết đồ đạc, không để lại rác thải, đồ hỏng hoặc vật dụng cá nhân.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={criteria.wallsAndFloorIntact}
              onChange={(e) => setCriteria({ ...criteria, wallsAndFloorIntact: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <div className="text-sm">
              <span className="font-medium text-slate-800">
                2. Mặt bằng sàn và vách tường nguyên vẹn
              </span>
              <p className="text-xs text-slate-500">
                Không nứt vỡ, không vẽ bậy, sàn khô ráo, không bị thấm dột hay ẩm mốc nặng.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={criteria.lockAndHingesWorking}
              onChange={(e) => setCriteria({ ...criteria, lockAndHingesWorking: e.target.checked })}
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <div className="text-sm">
              <span className="font-medium text-slate-800">
                3. Ổ khóa và bản lề đóng mở bình thường
              </span>
              <p className="text-xs text-slate-500">
                Cửa cuốn/cửa cơ kéo trơn tru, chốt khóa không móp méo, sẵn sàng bàn giao cho khách kế tiếp.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 2. Đánh giá tình trạng hiện trường (Condition) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">Đánh giá kết quả nghiệm thu</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleConditionChange('GOOD')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              condition === 'GOOD'
                ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-semibold text-emerald-800 text-sm">Đạt chuẩn (GOOD)</span>
              {condition === 'GOOD' && <CheckSquare className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-xs text-emerald-700">
              Mặt bằng sạch đẹp. Đề xuất hoàn trả 100% tiền cọc cho khách hàng.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleConditionChange('MINOR_DAMAGE')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              condition === 'MINOR_DAMAGE'
                ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-semibold text-amber-800 text-sm">Hư hại nhẹ</span>
              {condition === 'MINOR_DAMAGE' && <CheckSquare className="w-4 h-4 text-amber-600" />}
            </div>
            <p className="text-xs text-amber-700">
              Có vết bẩn/xước nhỏ, cần vệ sinh công nghiệp hoặc sơn sửa nhẹ.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleConditionChange('MAJOR_DAMAGE')}
            className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
              condition === 'MAJOR_DAMAGE'
                ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1">
              <span className="font-semibold text-rose-800 text-sm">Hư hại nặng</span>
              {condition === 'MAJOR_DAMAGE' && <CheckSquare className="w-4 h-4 text-rose-600" />}
            </div>
            <p className="text-xs text-rose-700">
              Hỏng cửa cuốn, biến dạng vách, hư ổ khóa thông minh.
            </p>
          </button>
        </div>

        {/* Form ghi nhận hư hại nếu có */}
        {condition !== 'GOOD' && (
          <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chi tiết mô tả hư hại hiện trường <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={damageNotes}
                onChange={(e) => setDamageNotes(e.target.value)}
                placeholder="Ví dụ: Bản lề cửa cuốn bị lệch 5cm, sàn kho còn vết sơn bám dính..."
                rows={2}
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Khoản trong danh mục <span className="text-rose-500">*</span>
              </label>
              {catalogFees.length === 0 ? (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Chưa có khoản vệ sinh hoặc bồi thường đang hiệu lực. Business Operations Manager cần niêm yết trước.
                </p>
              ) : (
                <div className="space-y-2">
                  {catalogFees.map((fee) => {
                    const line = catalogLineAmount(fee, contract.monthlyPrice || 0);
                    return (
                      <label
                        key={fee.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                      >
                        <span className="flex items-center gap-2 text-sm text-slate-800">
                          <input
                            type="checkbox"
                            checked={selectedFeeIds.includes(fee.id)}
                            onChange={() => toggleFee(fee.id)}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span>
                            {fee.name}
                            <span className="block text-[11px] text-slate-500">{feeCategoryLabel(fee.category)}</span>
                          </span>
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {fee.type === 'PERCENTAGE'
                            ? `${fee.amount}% · ${line.toLocaleString('vi-VN')} đ`
                            : `${line.toLocaleString('vi-VN')} đ`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Đường dẫn ảnh bằng chứng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Bảng tính quyết toán hoàn cọc trực quan */}
      <SettlementPreviewCard
        depositAmount={contract.depositAmount}
        damageCost={condition !== 'GOOD' ? catalogTotal : 0}
        condition={condition}
      />

      {/* 4. Khung ký số điện tử */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Chữ ký số xác nhận biên bản (Staff & Khách hàng)
        </h3>
        <SignaturePad onSignatureChange={setSignatureData} />

        <label className="flex items-center gap-2.5 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={customerAgreed}
            onChange={(e) => setCustomerAgreed(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
          />
          <span className="text-xs text-slate-700">
            Khách hàng và nhân viên trực đã kiểm tra thực tế, xác nhận đồng ý với kết quả nghiệm thu mặt bằng.
          </span>
        </label>
      </div>

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl font-medium bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Đang nộp biên bản...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Nộp biên bản & Gửi Facility Manager</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
