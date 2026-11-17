// frontend/src/features/bom/components/UnitTypeFormModal.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { UnitTypeFormData, UnitTypeResponse } from '@/types/unit';
import { X, Layers } from 'lucide-react';

interface UnitTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UnitTypeFormData) => Promise<void>;
  initialData?: UnitTypeResponse | null;
}

interface SizePreset {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL';
  label: string;
  widthM: number;
  depthM: number;
  heightM: number;
  areaM2: number;
  stdName: string;
  stdDesc: string;
  stdPrice: number;
  acName: string;
  acDesc: string;
  acPrice: number;
}

const SIZE_PRESETS: SizePreset[] = [
  {
    size: 'XS',
    label: 'Size XS (1 m²)',
    widthM: 1.0,
    depthM: 1.0,
    heightM: 2.5,
    areaM2: 1.0,
    stdName: 'Kho Tiêu Chuẩn XS',
    stdDesc: 'Tủ khóa cá nhân mini (1.0 m² · 2.5 m³). Phù hợp vali du lịch, tài liệu hồ sơ, thùng carton nhỏ.',
    stdPrice: 350000,
    acName: 'Kho Máy Lạnh XS',
    acDesc: 'Tủ điều hòa nhiệt ẩm mini 24/7 (1.0 m² · 2.5 m³). Phù hợp máy ảnh, đồng hồ, túi xách hiệu, hồ sơ mật.',
    acPrice: 500000,
  },
  {
    size: 'S',
    label: 'Size S (3 m²)',
    widthM: 1.5,
    depthM: 2.0,
    heightM: 2.5,
    areaM2: 3.0,
    stdName: 'Kho Tiêu Chuẩn S',
    stdDesc: 'Kho tiêu chuẩn kích thước S (3.0 m² · 7.5 m³). Phù hợp lưu trữ đồ dùng phòng trọ, 1 xe máy, 10-15 thùng đồ cá nhân.',
    stdPrice: 750000,
    acName: 'Kho Máy Lạnh S',
    acDesc: 'Kho điều hòa kiểm soát nhiệt ẩm 24/7 (20°C - 25°C). Phù hợp thiết bị điện tử, âm thanh, đồ da hàng hiệu, tranh ảnh giá trị.',
    acPrice: 1100000,
  },
  {
    size: 'M',
    label: 'Size M (6 m²)',
    widthM: 2.0,
    depthM: 3.0,
    heightM: 2.5,
    areaM2: 6.0,
    stdName: 'Kho Tiêu Chuẩn M',
    stdDesc: 'Kho tiêu chuẩn kích thước M (6.0 m² · 15.0 m³). Phù hợp đồ đạc căn hộ 1-2 phòng ngủ (sofa, tủ lạnh, bàn ghế, 20-30 thùng đồ).',
    stdPrice: 1500000,
    acName: 'Kho Máy Lạnh M',
    acDesc: 'Kho điều hòa kiểm soát nhiệt ẩm 24/7 (20°C - 25°C). Phù hợp lưu trữ rượu vang, đàn piano, nội thất gỗ quý, mỹ phẩm cao cấp.',
    acPrice: 2100000,
  },
  {
    size: 'L',
    label: 'Size L (10 m²)',
    widthM: 2.5,
    depthM: 4.0,
    heightM: 2.5,
    areaM2: 10.0,
    stdName: 'Kho Tiêu Chuẩn L',
    stdDesc: 'Kho tiêu chuẩn kích thước L (10.0 m² · 25.0 m³). Phù hợp chuyển nhà trọn gói, toàn bộ nội thất căn hộ 2-3 phòng ngủ.',
    stdPrice: 2400000,
    acName: 'Kho Máy Lạnh L',
    acDesc: 'Kho điều hòa kiểm soát nhiệt ẩm 24/7 (20°C - 25°C). Phù hợp mỹ phẩm phân phối, thực phẩm chức năng, thiết bị y tế tinh vi.',
    acPrice: 3400000,
  },
  {
    size: 'XL',
    label: 'Size XL (15 m²)',
    widthM: 3.0,
    depthM: 5.0,
    heightM: 3.0,
    areaM2: 15.0,
    stdName: 'Kho Tiêu Chuẩn XL',
    stdDesc: 'Kho tiêu chuẩn thương mại (15.0 m² · 45.0 m³). Phù hợp hàng kinh doanh online, vật tư sự kiện, thiết bị lớn.',
    stdPrice: 3500000,
    acName: 'Kho Máy Lạnh XL',
    acDesc: 'Tổng kho lạnh thương mại 24/7 (15.0 m² · 45.0 m³). Phù hợp hàng xa xỉ phẩm, dược phẩm chuỗi phân phối.',
    acPrice: 4800000,
  },
];

const empty: UnitTypeFormData = {
  name: '',
  description: '',
  widthM: 1.5,
  depthM: 2.0,
  heightM: 2.5,
  monthlyPrice: 750000,
  environment: 'STANDARD',
};

export const UnitTypeFormModal: React.FC<UnitTypeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [form, setForm] = useState<UnitTypeFormData>(empty);
  const [environment, setEnvironment] = useState<'STANDARD' | 'CLIMATE_CONTROLLED'>('STANDARD');
  const [selectedSize, setSelectedSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | null>('S');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const isClimate =
          (initialData.code || '').toUpperCase().includes('CLIMATE') ||
          (initialData.code || '').toUpperCase().includes('AC') ||
          initialData.name.toLowerCase().includes('lạnh') ||
          initialData.name.toLowerCase().includes('máy lạnh') ||
          initialData.name.toLowerCase().includes('điều hòa');
        const env = isClimate ? 'CLIMATE_CONTROLLED' : 'STANDARD';
        setEnvironment(env);
        setForm({
          name: initialData.name,
          description: initialData.description || '',
          widthM: initialData.widthM,
          depthM: initialData.depthM,
          heightM: initialData.heightM,
          monthlyPrice: initialData.monthlyPrice || 0,
          environment: env,
        });
        setSelectedSize(null);
      } else {
        // Mặc định chọn Size S của Kho Tiêu Chuẩn
        const defaultPreset = SIZE_PRESETS[1];
        setEnvironment('STANDARD');
        setSelectedSize('S');
        setForm({
          name: defaultPreset.stdName,
          description: defaultPreset.stdDesc,
          widthM: defaultPreset.widthM,
          depthM: defaultPreset.depthM,
          heightM: defaultPreset.heightM,
          monthlyPrice: defaultPreset.stdPrice,
          environment: 'STANDARD',
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const set = (f: keyof UnitTypeFormData, v: string | number) =>
    setForm((p) => ({ ...p, [f]: v }));

  // Xử lý khi bấm đổi môi trường (Kho Tiêu Chuẩn <-> Kho Máy Lạnh)
  const handleSelectEnvironment = (newEnv: 'STANDARD' | 'CLIMATE_CONTROLLED') => {
    setEnvironment(newEnv);
    setForm((prev) => {
      let newName = prev.name;
      let newDesc = prev.description;
      let newPrice = prev.monthlyPrice;

      if (selectedSize) {
        const preset = SIZE_PRESETS.find((p) => p.size === selectedSize);
        if (preset) {
          newName = newEnv === 'STANDARD' ? preset.stdName : preset.acName;
          newDesc = newEnv === 'STANDARD' ? preset.stdDesc : preset.acDesc;
          newPrice = newEnv === 'STANDARD' ? preset.stdPrice : preset.acPrice;
        }
      } else {
        if (newEnv === 'CLIMATE_CONTROLLED') {
          newName = prev.name.replace(/Kho Tiêu Chuẩn|Tiêu Chuẩn/gi, 'Kho Máy Lạnh');
          if (!newName.includes('Máy Lạnh')) newName = `Kho Máy Lạnh ${newName}`.trim();
        } else {
          newName = prev.name.replace(/Kho Máy Lạnh|Máy Lạnh/gi, 'Kho Tiêu Chuẩn');
          if (!newName.includes('Tiêu Chuẩn')) newName = `Kho Tiêu Chuẩn ${newName}`.trim();
        }
      }

      return {
        ...prev,
        environment: newEnv,
        name: newName,
        description: newDesc,
        monthlyPrice: newPrice,
      };
    });
  };

  // Xử lý khi bấm chọn Size Preset (XS, S, M, L, XL)
  const handleSelectPreset = (preset: SizePreset) => {
    setSelectedSize(preset.size);
    setForm((prev) => ({
      ...prev,
      name: environment === 'STANDARD' ? preset.stdName : preset.acName,
      description: environment === 'STANDARD' ? preset.stdDesc : preset.acDesc,
      widthM: preset.widthM,
      depthM: preset.depthM,
      heightM: preset.heightM,
      monthlyPrice: environment === 'STANDARD' ? preset.stdPrice : preset.acPrice,
      environment,
    }));
  };

  const calculatedArea = Number((form.widthM * form.depthM).toFixed(1));
  const calculatedVolume =
    form.heightM > 0
      ? Number((form.widthM * form.depthM * form.heightM).toFixed(1))
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Tên loại ô kho không được để trống.'); return; }
    if (form.widthM <= 0 || form.depthM <= 0) { setError('Chiều rộng và chiều sâu phải lớn hơn 0.'); return; }
    if (form.widthM > 999.99 || form.depthM > 999.99 || (form.heightM && form.heightM > 999.99)) {
      setError('Kích thước (Rộng, Sâu, Cao) tính bằng mét (m), tối đa 999.99m.');
      return;
    }
    if (form.monthlyPrice <= 0) {
      setError('Đơn giá niêm yết (VND/tháng) phải lớn hơn 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        ...form,
        environment,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lưu thông tin thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20 transition-all';
  const labelCls = 'block text-xs font-semibold text-slate-700 mb-1.5';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {initialData ? 'Chỉnh sửa loại ô kho (BOM)' : 'Định nghĩa loại ô kho mới (BOM)'}
              </h2>
              <p className="text-[11px] text-slate-500">Master Catalog toàn hệ thống • Ban Giám Đốc phê duyệt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form id="unit-type-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4 flex-1 overflow-y-auto">
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          {/* BƯỚC 1: Chọn Môi trường Kho */}
          <div>
            <label className={labelCls}>
              1. Danh mục môi trường bảo quản Self-Storage <span className="text-rose-500">*</span>
            </label>
            <div className="inline-flex w-full bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleSelectEnvironment('STANDARD')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  environment === 'STANDARD'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kho Tiêu Chuẩn
              </button>
              <button
                type="button"
                onClick={() => handleSelectEnvironment('CLIMATE_CONTROLLED')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  environment === 'CLIMATE_CONTROLLED'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kho Máy Lạnh
              </button>
            </div>
          </div>

          {/* BƯỚC 2: Chọn Kích Thước Quy Chuẩn (Size Presets) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              2. Chọn nhanh kích thước quy chuẩn
            </label>
            <div className="grid grid-cols-5 gap-2">
              {SIZE_PRESETS.map((p) => {
                const isSelected = selectedSize === p.size;
                return (
                  <button
                    key={p.size}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/80 text-brand-800 font-bold ring-2 ring-brand-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black block num">{p.size}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{p.areaM2} m²</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tên loại ô kho */}
          <div>
            <label className={labelCls}>
              Tên loại ô kho <span className="text-rose-500">*</span>
            </label>
            <input
              id="ut-name"
              type="text"
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value);
                setSelectedSize(null);
              }}
              placeholder="VD: Kho Tiêu Chuẩn S hoặc Kho Máy Lạnh M"
              className={inputCls}
            />
          </div>

          {/* Mô tả công năng */}
          <div>
            <label className={labelCls}>Mô tả công năng khuyến nghị</label>
            <textarea
              id="ut-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Mô tả gợi ý loại đồ đạc, tải trọng phù hợp..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Kích thước Rộng x Sâu x Cao */}
          <div>
            <label className={labelCls}>
              Kích thước <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {(
                [
                  { field: 'widthM' as const, label: 'Rộng' },
                  { field: 'depthM' as const, label: 'Sâu' },
                  { field: 'heightM' as const, label: 'Cao' },
                ] as const
              ).map(({ field, label }, index) => (
                <React.Fragment key={field}>
                  {index > 0 && <span className="text-slate-400">×</span>}
                  <input
                    id={`ut-${field}`}
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="999.99"
                    aria-label={label}
                    placeholder={label}
                    value={form[field] ? form[field] : ''}
                    onChange={(e) => {
                      set(field, parseFloat(e.target.value) || 0);
                      setSelectedSize(null);
                    }}
                    className={`${inputCls} num text-center`}
                  />
                </React.Fragment>
              ))}
              <span className="text-sm font-medium text-slate-500 shrink-0">m</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Diện tích {calculatedArea} m²
              <span className="mx-1.5 text-slate-300">·</span>
              Thể tích {calculatedVolume == null ? '—' : `${calculatedVolume} m³`}
            </p>
          </div>

          {/* Đơn giá niêm yết (BOM bắt buộc nhập) */}
          <div>
            <label className={labelCls}>
              Đơn giá niêm yết (VND/tháng) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="ut-price"
                type="number"
                min="10000"
                step="50000"
                value={form.monthlyPrice || ''}
                onChange={(e) => set('monthlyPrice', parseInt(e.target.value, 10) || 0)}
                className={`${inputCls} num font-bold text-slate-900 text-base pr-24`}
                placeholder="VD: 750000"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">
                VND/tháng
              </span>
            </div>
            {calculatedArea > 0 && form.monthlyPrice > 0 && (
              <p className="text-[11px] text-slate-500 mt-1">
                Tương đương: <strong className="text-slate-700 num">{Math.round(form.monthlyPrice / calculatedArea).toLocaleString('vi-VN')} đ/m²/tháng</strong>
              </p>
            )}
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            form="unit-type-form"
            id="ut-submit"
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-bold bg-brand-500 text-white rounded-xl hover:bg-brand-600 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {submitting ? 'Đang lưu...' : initialData ? 'Cập nhật loại kho' : 'Tạo loại kho'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
