import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, Plus, Eye, X } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

interface ImageGalleryProps {
  title?: string;
  images?: string[];
  onAddImage?: () => void;
  plain?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  title = 'Hình ảnh hiện trường & Bằng chứng',
  images = [],
  onAddImage,
  plain = false,
}) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  useScrollLock(!!selectedImg);

  useEffect(() => {
    if (!selectedImg) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImg(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImg]);

  const gridContent = (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {images.map((img, idx) => (
        <div
          key={idx}
          className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center"
        >
          {failedImages[idx] ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-slate-400 bg-slate-50 text-center select-none">
              <ImageIcon className="w-5 h-5 text-slate-300 mb-1" />
              <span className="text-[11px] font-medium text-slate-500">Ảnh không khả dụng</span>
              <span className="text-[9px] text-slate-400 truncate max-w-[90%]">Bằng chứng {idx + 1}</span>
            </div>
          ) : (
            <>
              <img
                src={img}
                alt={`Bằng chứng ${idx + 1}`}
                onError={() => setFailedImages((prev) => ({ ...prev, [idx]: true }))}
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
            </>
          )}
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
  );

  return (
    <>
      {plain ? (
        gridContent
      ) : (
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
          {gridContent}
        </div>
      )}

      {/* Lightbox xem ảnh phóng to không viền khung xanh */}
      {selectedImg &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-150"
            onClick={() => setSelectedImg(null)}
          >
            {/* Nút đóng tròn mờ ở góc phải */}
            <button
              type="button"
              onClick={() => setSelectedImg(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer z-20 shadow-lg"
              title="Đóng (Esc)"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Bức ảnh tự nhiên tràn viền, không đóng khung hộp màu xanh */}
            <div
              className="relative max-w-5xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImg}
                alt="Phóng to"
                className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl transition-transform"
              />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
