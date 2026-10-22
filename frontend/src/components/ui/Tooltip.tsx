// frontend/src/components/ui/Tooltip.tsx
import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'center' | 'start' | 'end';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  align = 'center',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Tính toán vị trí dựa theo position và align để chống tràn viền (overflow scrollbar)
  let posClass = '';
  let arrowClass = '';

  if (position === 'top') {
    if (align === 'end') {
      posClass = 'bottom-full right-0 mb-1.5';
      arrowClass = 'top-full right-2.5 border-t-slate-900 border-x-transparent border-b-transparent';
    } else if (align === 'start') {
      posClass = 'bottom-full left-0 mb-1.5';
      arrowClass = 'top-full left-2.5 border-t-slate-900 border-x-transparent border-b-transparent';
    } else {
      posClass = 'bottom-full left-1/2 -translate-x-1/2 mb-1.5';
      arrowClass = 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent';
    }
  } else if (position === 'bottom') {
    if (align === 'end') {
      posClass = 'top-full right-0 mt-1.5';
      arrowClass = 'bottom-full right-2.5 border-b-slate-900 border-x-transparent border-t-transparent';
    } else if (align === 'start') {
      posClass = 'top-full left-0 mt-1.5';
      arrowClass = 'bottom-full left-2.5 border-b-slate-900 border-x-transparent border-t-transparent';
    } else {
      posClass = 'top-full left-1/2 -translate-x-1/2 mt-1.5';
      arrowClass = 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent';
    }
  } else if (position === 'left') {
    posClass = 'right-full top-1/2 -translate-y-1/2 mr-1.5';
    arrowClass = 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent';
  } else if (position === 'right') {
    posClass = 'left-full top-1/2 -translate-y-1/2 ml-1.5';
    arrowClass = 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent';
  }

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute z-50 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 duration-150 ${posClass}`}
        >
          {content}
          <span className={`absolute w-0 h-0 border-4 ${arrowClass}`} />
        </div>
      )}
    </div>
  );
};
