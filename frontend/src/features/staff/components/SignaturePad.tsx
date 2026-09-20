import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, PenLine, Check } from 'lucide-react';

export interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Khởi tạo kích thước thực tế cho Canvas theo CSS container
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0a1614'; // Deep Pine Obsidian
      ctx.lineWidth = 2.5;
    }
  }, []);

  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      // Khi resize thì chỉ scale lại nếu chưa ký để tránh mất nét
      if (!hasSignature) {
        initCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas, hasSignature]);

  // Lấy tọa độ tương đối trên Canvas
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || disabled) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if (!hasSignature) {
      setHasSignature(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  // Xóa chữ ký
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(null);
  };

  // Ký mẫu tự động (tiện lợi cho việc demo hoặc khách ủy quyền xác nhận nhanh)
  const handleSampleSignature = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    handleClear();

    const rect = canvas.getBoundingClientRect();
    const startX = rect.width * 0.2;
    const startY = rect.height * 0.6;

    ctx.save();
    ctx.strokeStyle = '#0d9488'; // Teal
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    // Vẽ nét ký lượn sóng tự nhiên
    ctx.bezierCurveTo(startX + 30, startY - 40, startX + 60, startY + 30, startX + 90, startY - 20);
    ctx.bezierCurveTo(startX + 120, startY - 50, startX + 140, startY + 10, startX + 170, startY - 10);
    ctx.bezierCurveTo(startX + 200, startY - 30, startX + 220, startY + 20, startX + 250, startY);
    ctx.stroke();

    // Thêm gạch chân chữ ký
    ctx.beginPath();
    ctx.moveTo(startX + 20, startY + 20);
    ctx.lineTo(startX + 260, startY + 20);
    ctx.stroke();
    ctx.restore();

    setHasSignature(true);
    const dataUrl = canvas.toDataURL('image/png');
    onSignatureChange(dataUrl);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <PenLine className="w-3.5 h-3.5 text-brand-600" />
          Ký trực tiếp bằng ngón tay / bút cảm ứng hoặc chuột
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSampleSignature}
            disabled={disabled}
            className="text-brand-600 hover:text-brand-700 font-medium px-2 py-0.5 rounded hover:bg-brand-50 transition-colors cursor-pointer"
          >
            Ký mẫu nhanh
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || !hasSignature}
            className="flex items-center gap-1 text-slate-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed font-medium px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Eraser className="w-3 h-3" />
            Xóa
          </button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner h-36">
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none ${
            disabled ? 'cursor-not-allowed bg-slate-50' : 'cursor-crosshair'
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Đường gạch ngang mờ đánh dấu vị trí ký */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-slate-200 pointer-events-none flex items-center justify-between text-[11px] text-slate-400">
          <span>Khách hàng ký & ghi rõ họ tên</span>
          {hasSignature && (
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Check className="w-3.5 h-3.5" />
              Đã ghi nhận chữ ký
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
