import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { 
  X, 
  KeyRound, 
  Wrench, 
  CreditCard, 
  Package, 
  HelpCircle, 
  AlertTriangle, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  Info
} from 'lucide-react';
import type { 
  SupportCategory, 
  CreateSupportTicketPayload, 
  RentedContract,
  Facility
} from '../types';

export interface CreateSupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentals: RentedContract[];
  facilities: Facility[];
  preselectedContractId?: string;
  preselectedUnitId?: string;
  onSubmit: (payload: CreateSupportTicketPayload) => Promise<void>;
}

const CATEGORIES: { 
  key: SupportCategory; 
  label: string; 
  desc: string; 
  icon: React.ElementType;
  urgentDefault?: boolean;
}[] = [
  {
    key: 'LOCK_ACCESS',
    label: 'Khóa & Mã PIN',
    desc: 'Kẹt chốt cơ, hỏng bàn phím điện tử, cửa không nhận tín hiệu',
    icon: KeyRound,
  },
  {
    key: 'UNIT_DAMAGE',
    label: 'Hư hỏng kho & Đèn',
    desc: 'Bóng đèn tắt, cửa cuốn kẹt, thấm dột, ẩm mốc',
    icon: Wrench,
  },
  {
    key: 'PAYMENT',
    label: 'Thanh toán & Phí',
    desc: 'Lỗi nạp cọc, sai biên lai, hoàn trả tiền thừa',
    icon: CreditCard,
  },
  {
    key: 'BELONGINGS',
    label: 'Tài sản & Xe đẩy',
    desc: 'Mượn xe nâng hàng, kiểm đếm, hỗ trợ bốc xếp',
    icon: Package,
  },
  {
    key: 'OTHER',
    label: 'Vấn đề khác',
    desc: 'Ý kiến đóng góp, thắc mắc dịch vụ cơ sở',
    icon: HelpCircle,
  },
];


export const CreateSupportTicketModal: React.FC<CreateSupportTicketModalProps> = ({
  isOpen,
  onClose,
  rentals,
  facilities,
  preselectedContractId,
  preselectedUnitId,
  onSubmit,
}) => {
  // Lọc chỉ những hợp đồng đang hoạt động hoặc chưa kết thúc
  const activeRentals = rentals.filter((r) => {
    const s = (r.status as string) || '';
    if (!s) return true;
    return !['CLOSED', 'TERMINATED', 'CANCELLED', 'RETURNED'].includes(s);
  });

  const getInitialContractId = (): string => {
    if (preselectedContractId && activeRentals.some(r => String(r.id) === String(preselectedContractId))) {
      return preselectedContractId;
    }
    if (preselectedUnitId) {
      const found = activeRentals.find(r => String(r.unitId) === String(preselectedUnitId));
      if (found) return found.id;
    }
    return activeRentals[0]?.id || '';
  };

  const [selectedContractId, setSelectedContractId] = useState<string>(getInitialContractId);

  // Đồng bộ selectedContractId khi activeRentals được tải xong hoặc props thay đổi
  useEffect(() => {
    if (activeRentals.length > 0) {
      setSelectedContractId((current) => {
        if (preselectedContractId && activeRentals.some((r) => String(r.id) === String(preselectedContractId))) {
          return String(preselectedContractId);
        }
        if (preselectedUnitId) {
          const matchUnit = activeRentals.find((r) => String(r.unitId) === String(preselectedUnitId));
          if (matchUnit) return String(matchUnit.id);
        }
        if (!current || !activeRentals.some((r) => String(r.id) === String(current))) {
          return String(activeRentals[0].id);
        }
        return current;
      });
    }
  }, [activeRentals, preselectedContractId, preselectedUnitId]);

  const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('LOCK_ACCESS');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectCategory = (cat: SupportCategory) => {
    setSelectedCategory(cat);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (attachments.length + files.length > 5) {
      setErrorMsg('Bạn chỉ có thể đính kèm tối đa 5 hình ảnh minh họa (US-SC-06.1)');
      return;
    }

    // Convert to mock blob/base64 or local object URLs
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Mỗi ảnh dung lượng tối đa 5 MB');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setAttachments(prev => [...prev, previewUrl]);
      setErrorMsg(null);
    });
  };


  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Vui lòng nhập mô tả sự cố chi tiết từ 10 ký tự trở lên để nhân viên nắm rõ thông tin.');
      return;
    }

    if (activeRentals.length === 0) {
      setErrorMsg('Bạn hiện không có hợp đồng kho nào đang hoạt động để gửi yêu cầu hỗ trợ.');
      return;
    }

    // Find selected contract with robust fallback to first active contract
    const contract =
      activeRentals.find((r) => String(r.id) === String(selectedContractId)) ||
      (preselectedContractId ? activeRentals.find((r) => String(r.id) === String(preselectedContractId)) : undefined) ||
      activeRentals[0];

    if (!contract) {
      setErrorMsg('Vui lòng chọn ô kho / hợp đồng đang thuê liên quan để gửi yêu cầu hỗ trợ.');
      return;
    }

    const rawFacilityId = contract.facilityId || (facilities.length > 0 ? facilities[0].id : '1');
    const facilityId = Number(rawFacilityId) || Number(String(rawFacilityId).replace(/\D/g, '')) || 1;

    const rawUnitId = contract.unitId;
    const storageUnitId = rawUnitId ? (Number(rawUnitId) || Number(String(rawUnitId).replace(/\D/g, '')) || undefined) : undefined;

    const contractId = Number(contract.id) || Number(String(contract.id).replace(/\D/g, '')) || undefined;

    try {
      setLoading(true);
      await onSubmit({
        contractId,
        facilityId,
        storageUnitId,
        title: title.trim() || undefined,
        category: selectedCategory,
        isUrgent: false,
        description: description.trim(),
        attachmentUrls: attachments,
      });

      // Reset form
      setDescription('');
      setTitle('');
      setAttachments([]);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi yêu cầu hỗ trợ.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Báo Sự Cố & Gửi Yêu Cầu Hỗ Trợ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đội ngũ kỹ thuật và nhân viên trực cơ sở sẽ hỗ trợ bạn kịp thời
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Chọn ô kho / hợp đồng */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              1. Chọn ô kho đang thuê liên quan <span className="text-rose-500">*</span>
            </label>
            {activeRentals.length > 0 ? (
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {activeRentals.map((r) => (
                  <option key={r.id} value={r.id}>
                    Kho {r.unitNumber} — {r.facilityName} ({r.unitTypeName})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-600 shrink-0" />
                <span>Bạn hiện không có hợp đồng kho nào đang hoạt động để gửi yêu cầu hỗ trợ theo ô kho.</span>
              </div>
            )}
          </div>

          {/* 2. Chọn loại sự cố */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              2. Phân loại sự cố <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    onClick={() => handleSelectCategory(cat.key)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                        {cat.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Tiêu đề tóm tắt */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
              3. Tiêu đề ngắn gọn (Tùy chọn)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kẹt khóa điện tử ô A-108, Đèn trần bị chập..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* 4. Chi tiết sự cố */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                4. Mô tả chi tiết vấn đề <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] ${description.length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                {description.length} / 1000 ký tự (tối thiểu 10)
              </span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể hiện tượng gặp phải, thời gian xảy ra, các thao tác đã thử..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* 5. Thông tin xử lý */}
          {selectedCategory === 'LOCK_ACCESS' && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-blue-900 block">
                  Smart PIN Hint
                </span>
                <span className="text-[11px] text-blue-800/80 leading-relaxed block mt-0.5">
                  Kiểm tra lại mã PIN của bạn trong phần "Kho của tôi" hoặc yêu cầu cấp lại mã mới nếu quên.
                </span>
              </div>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-800 block mb-1">
              Thời gian tiếp nhận & xử lý
            </span>
            <span className="text-[11px] text-slate-600 leading-relaxed block">
              Quản lý cơ sở (FM) sẽ tiếp nhận và đánh giá mức độ khẩn cấp của sự cố để điều phối nhân viên kỹ thuật có mặt hỗ trợ trong thời gian sớm nhất.
            </span>
          </div>

          {/* 6. Đính kèm ảnh */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                5. Hình ảnh minh chứng (Tối đa 5 ảnh, &lt; 5MB/ảnh)
              </label>
              <span className="text-[11px] text-slate-400">
                {attachments.length} / 5 ảnh
              </span>
            </div>

            {/* Attachments preview grid */}
            <div className="flex flex-wrap items-center gap-3">
              {attachments.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden group bg-slate-100">
                  <img src={url} alt={`Minh họa ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {attachments.length < 5 && (
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-500 flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 cursor-pointer transition-colors bg-slate-50/50">
                  <Upload className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              )}
            </div>

          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={loading}
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 font-bold text-white shadow-sm"
            >
              {loading ? (
                <span>Đang gửi...</span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Gửi yêu cầu hỗ trợ
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
