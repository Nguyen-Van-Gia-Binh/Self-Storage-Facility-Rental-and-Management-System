import React, { useState } from 'react';
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
    desc: 'Kẹt khóa cơ, hỏng bàn phím, quên mã số mở cửa (SLA 2h)',
    icon: KeyRound,
    urgentDefault: true,
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

const SAMPLE_IMAGE_PRESETS = [
  {
    name: 'Kẹt ổ khóa',
    url: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Đèn hỏng',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cửa ô kho',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
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
  const getInitialContractId = (): string => {
    if (preselectedContractId) return preselectedContractId;
    if (preselectedUnitId) {
      const found = rentals.find(r => r.unitId === preselectedUnitId);
      if (found) return found.id;
    }
    return rentals[0]?.id || '';
  };

  const [selectedContractId, setSelectedContractId] = useState<string>(getInitialContractId);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory>('LOCK_ACCESS');
  const [isUrgent, setIsUrgent] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // When changing category, auto toggle urgent if lock access
  const handleSelectCategory = (cat: SupportCategory) => {
    setSelectedCategory(cat);
    if (cat === 'LOCK_ACCESS') {
      setIsUrgent(true);
    }
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

  const handleAddPreset = (url: string) => {
    if (attachments.length >= 5) {
      setErrorMsg('Chỉ được đính kèm tối đa 5 hình ảnh.');
      return;
    }
    setAttachments(prev => [...prev, url]);
    setErrorMsg(null);
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

    // Find selected contract
    const contract = rentals.find(r => String(r.id) === String(selectedContractId));
    let facilityId = 1;
    let storageUnitId: number | undefined;

    if (contract) {
      facilityId = contract.facilityId === 'FAC-D7-02' ? 2 : 1;
      storageUnitId = contract.unitId === 'U-A108' ? 8 : 4;
    } else if (facilities.length > 0) {
      facilityId = facilities[0].id === 'FAC-D7-02' ? 2 : 1;
    }

    try {
      setLoading(true);
      await onSubmit({
        contractId: contract ? (typeof contract.id === 'number' ? contract.id : (parseInt(String(contract.id).replace(/\D/g, ''), 10) || 89)) : undefined,
        facilityId,
        storageUnitId,
        title: title.trim() || undefined,
        category: selectedCategory,
        isUrgent,
        description: description.trim(),
        attachmentUrls: attachments,
      });

      // Reset form
      setDescription('');
      setTitle('');
      setAttachments([]);
      setIsUrgent(false);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi gửi yêu cầu hỗ trợ.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Báo Sự Cố & Gửi Yêu Cầu Hỗ Trợ (SC-06)</span>
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
            {rentals.length > 0 ? (
              <select
                value={selectedContractId}
                onChange={(e) => setSelectedContractId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {rentals.map((r) => (
                  <option key={r.id} value={r.id}>
                    Kho {r.unitNumber} — {r.facilityName} ({r.unitTypeName})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <Info className="w-4 h-4 text-brand-600" />
                <span>Yêu cầu chung cho cơ sở (Bạn chưa có hợp đồng kho đang hoạt động)</span>
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

          {/* 5. Cờ khẩn cấp (SLA 2 giờ) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Sự cố khẩn cấp (Cam kết SLA xử lý tại chỗ trong vòng 2 giờ)
                </span>
                <span className="text-[11px] text-amber-800/80 leading-relaxed block mt-0.5">
                  Áp dụng theo quy định <strong>BR-SUP-01</strong> cho các tình huống kẹt khóa, mất quyền truy cập, khẩn cấp lấy tài sản hoặc rò rỉ điện nước nguy hiểm.
                </span>
              </div>
            </label>
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

            {/* Demo Presets for quick test */}
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600">Thêm nhanh ảnh mẫu:</span>
              {SAMPLE_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddPreset(preset.url)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-medium text-[10px]"
                >
                  + {preset.name}
                </button>
              ))}
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
    </div>
  );
};
