import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Trash2, RefreshCw, X, Check, Image as ImageIcon } from 'lucide-react';

export interface EvidencePhotoCaptureProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  required?: boolean;
  compact?: boolean;
  helperText?: string;
}

/**
 * Nén ảnh từ File hoặc Image element sang Data URL JPEG gọn nhẹ để lưu CSDL & hiển thị nhanh
 */
function compressImageToDataUrl(source: HTMLVideoElement | HTMLImageElement, maxDim = 800): string {
  const canvas = document.createElement('canvas');
  let width =
    source instanceof HTMLVideoElement ? source.videoWidth || 640 : source.naturalWidth || 640;
  let height =
    source instanceof HTMLVideoElement ? source.videoHeight || 480 : source.naturalHeight || 480;

  if (width > maxDim || height > maxDim) {
    if (width > height) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    } else {
      width = Math.round((width * maxDim) / height);
      height = maxDim;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(source, 0, 0, width, height);
  }
  return canvas.toDataURL('image/jpeg', 0.8);
}

export const EvidencePhotoCapture: React.FC<EvidencePhotoCaptureProps> = ({
  photos,
  onChange,
  maxPhotos = 5,
  label,
  required = false,
  compact = false,
  helperText,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement | null>(null);

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCameraStream = useCallback(
    async (mode: 'user' | 'environment') => {
      stopCameraStream();
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraOpen(false);
        cameraFallbackInputRef.current?.click();
        return;
      }

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: mode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // Fallback nếu thiết bị không hỗ trợ ràng buộc facingMode
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Không thể mở trực tiếp Camera qua WebRTC:', err);
        setCameraError(
          'Trình duyệt chưa cấp quyền Camera hoặc thiết bị không có Webcam. Bạn có thể bấm "Chọn ảnh từ thiết bị" bên dưới.',
        );
      }
    },
    [stopCameraStream],
  );

  useEffect(() => {
    if (isCameraOpen) {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isCameraOpen, facingMode, startCameraStream, stopCameraStream]);

  const handleOpenCamera = () => {
    if (photos.length >= maxPhotos) return;
    setIsCameraOpen(true);
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const dataUrl = compressImageToDataUrl(videoRef.current);
    const next = maxPhotos === 1 ? [dataUrl] : [...photos, dataUrl].slice(0, maxPhotos);
    onChange(next);
    setIsCameraOpen(false);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxPhotos === 1 ? 1 : maxPhotos - photos.length;
    const selectedFiles = Array.from(files).slice(0, remaining);

    Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                resolve(compressImageToDataUrl(img));
              };
              img.onerror = () => {
                resolve(typeof reader.result === 'string' ? reader.result : '');
              };
              img.src = typeof reader.result === 'string' ? reader.result : '';
            };
            reader.readAsDataURL(file);
          }),
      ),
    ).then((newUrls) => {
      const valid = newUrls.filter(Boolean);
      if (valid.length > 0) {
        const next = maxPhotos === 1 ? [valid[0]] : [...photos, ...valid].slice(0, maxPhotos);
        onChange(next);
      }
    });

    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-2.5">
      {/* Header Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-teal-600" />
            <span>
              {label} {required && <span className="text-rose-500">*</span>}
            </span>
          </label>
          {maxPhotos > 1 && (
            <span className="text-[11px] font-semibold text-slate-400">
              {photos.length}/{maxPhotos} ảnh
            </span>
          )}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={maxPhotos > 1}
        onChange={handleFilesSelected}
        className="hidden"
      />
      <input
        ref={cameraFallbackInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFilesSelected}
        className="hidden"
      />

      {/* Khu vực điều khiển Chụp Camera & Tải ảnh */}
      <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Nút 1: Kích hoạt Camera trước để chụp trực tiếp */}
            <button
              type="button"
              onClick={handleOpenCamera}
              disabled={!canAddMore}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{photos.length > 0 && maxPhotos === 1 ? 'Chụp lại bằng Camera' : 'Mở Camera chụp ảnh'}</span>
            </button>

            {/* Nút 2: Chọn file ảnh có sẵn từ máy tính / điện thoại */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAddMore}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Tải ảnh từ thiết bị</span>
            </button>
          </div>

          {helperText && (
            <span className="text-[11px] text-slate-500">{helperText}</span>
          )}
        </div>

        {/* Lưới hiển thị ảnh đã chụp / tải lên */}
        {photos.length > 0 ? (
          <div className={`grid gap-2.5 pt-1 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'}`}>
            {photos.map((url, idx) => (
              <div
                key={idx}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-4/3 shadow-2xs"
              >
                <img
                  src={url}
                  alt={`Ảnh hiện trường ${idx + 1}`}
                  onClick={() => setPreviewPhoto(url)}
                  className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-white">
                    Ảnh #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="p-1 rounded-md bg-rose-600/90 hover:bg-rose-600 text-white transition cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={handleOpenCamera}
            className="border border-dashed border-slate-300 rounded-xl bg-white/80 hover:bg-teal-50/30 hover:border-teal-400 transition py-4 px-3 flex items-center justify-center gap-2.5 text-xs text-slate-500 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Chưa có ảnh hiện trường — Bấm <strong>Mở Camera chụp ảnh</strong> để kích hoạt webcam/camera trước hoặc chọn ảnh từ máy.
            </span>
          </div>
        )}
      </div>

      {/* Modal Camera Trực tiếp (WebRTC getUserMedia) */}
      {isCameraOpen &&
        createPortal(
          <div className="fixed inset-0 z-[120] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
              {/* Header Camera */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Chụp ảnh hiện trường trực tiếp ({facingMode === 'user' ? 'Camera trước' : 'Camera sau'})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Khung hình Video trực tiếp */}
              <div className="relative bg-slate-950 aspect-video w-full flex items-center justify-center overflow-hidden">
                {cameraError ? (
                  <div className="p-6 text-center space-y-3 text-white max-w-sm">
                    <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCameraOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Chọn ảnh từ thiết bị</span>
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                )}
              </div>

              {/* Thanh điều khiển chụp */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đổi Camera Trước / Sau</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  {!cameraError && (
                    <button
                      type="button"
                      onClick={handleCaptureFrame}
                      className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Chụp & Lưu ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal Xem ảnh phóng to */}
      {previewPhoto &&
        createPortal(
          <div
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
          >
            <img
              src={previewPhoto}
              alt="Xem chi tiết ảnh hiện trường"
              className="max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl border border-white/20 object-contain"
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
