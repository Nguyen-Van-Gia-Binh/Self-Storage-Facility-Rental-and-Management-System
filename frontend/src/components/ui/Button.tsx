import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    // 1. Primary: Clean Mint Teal (#57b29a)
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 shadow-sm shadow-brand-500/20',
    // 2. Secondary: Soft Sky Blue (#96b3cf)
    secondary: 'bg-[#96b3cf]/15 text-[#1e3a5f] border border-[#96b3cf]/40 hover:bg-[#96b3cf]/25 focus:ring-[#96b3cf]',
    // 3. Accent: Denim Periwinkle (#7c94c3)
    accent: 'bg-[#7c94c3] text-white hover:bg-[#6982b1] focus:ring-[#7c94c3] shadow-sm',
    // Khác
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-brand-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Đang tải...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
