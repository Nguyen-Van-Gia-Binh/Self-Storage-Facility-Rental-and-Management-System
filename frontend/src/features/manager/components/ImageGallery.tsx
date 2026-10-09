// frontend/src/features/manager/components/ImageGallery.tsx
import React, { useState } from 'react';
import { Image as ImageIcon, Plus, Eye, X } from 'lucide-react';

interface ImageGalleryProps {
  title?: string;
  images?: string[];
  onAddImage?: () => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  title = 'Hình ảnh hiện trường & Bằng chứng',
  images = [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=600&q=80',
  ],
  onAddImage,
}) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">{title}</h3>
        </div>
        {onAddImage && (
          <button
            type="button"
            onClick={onAddImage}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ảnh</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100"
          >
            <img
              src={img}
              alt={`Bằng chứng ${idx + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => setSelectedImg(img)}
                className="p-1.5 rounded-full bg-white/90 text-slate-800 hover:bg-white shadow-xs cursor-pointer"
                title="Phóng to"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {onAddImage && (
          <button
            type="button"
            onClick={onAddImage}
            className="rounded-xl border border-dashed border-slate-300 aspect-video flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/20 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[11px] font-medium">+ Thêm ảnh</span>
          </button>
        )}
      </div>

      {/* Modal xem ảnh */}
      {selectedImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedImg(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={selectedImg} alt="Phóng to" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
