import React from 'react';
import { Link } from 'react-router-dom';
import { Boxes } from 'lucide-react';

export interface LogoProps {
  /**
   * Đường dẫn chuyển hướng khi click (tùy chọn).
   * Nếu không truyền, render dạng div tĩnh.
   */
  to?: string;
  /**
   * Biến thể màu sắc phù hợp với nền sáng/tối.
   * - 'dark': Dành cho nền sáng (chữ màu đen/slate-900, phụ đề brand-600)
   * - 'light': Dành cho nền tối (chữ màu trắng, phụ đề slate-400)
   */
  variant?: 'dark' | 'light';
  /**
   * Kích thước của Logo:
   * - 'sm': Nhỏ (cho mobile header, sidebar dashboard, footer)
   * - 'md': Vừa (cho navbar customer, header chính)
   * - 'lg': Lớn (cho auth hero showcase, landing page)
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Nhãn phụ đề bên dưới tên thương hiệu.
   * Mặc định: 'Self-Storage Solutions'
   */
  subtitle?: React.ReactNode;
  /**
   * Ẩn/hiện phụ đề.
   */
  showSubtitle?: boolean;
  /**
   * Badge phiên bản hiển thị bên cạnh tên thương hiệu (ví dụ: 'v2.0').
   */
  badge?: string;
  /**
   * Chỉ hiển thị biểu tượng icon hình 3 khối hộp (dành cho thanh sidebar thu gọn).
   */
  iconOnly?: boolean;
  /**
   * Lớp CSS tùy chỉnh bổ sung.
   */
  className?: string;
  /**
   * Sự kiện click tùy chọn (ví dụ: đóng mobile drawer).
   */
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    box: 'w-8 h-8 rounded-lg',
    icon: 'w-4 h-4',
    title: 'text-sm font-extrabold',
    subtitle: 'text-[9px] font-bold tracking-wider',
    gap: 'gap-2',
    badge: 'text-[9px] px-1.5 py-0.2',
  },
  md: {
    box: 'w-9 h-9 rounded-lg',
    icon: 'w-5 h-5',
    title: 'text-lg font-extrabold',
    subtitle: 'text-[10px] font-bold tracking-wider uppercase',
    gap: 'gap-2.5',
    badge: 'text-[10px] px-1.5 py-0.5',
  },
  lg: {
    box: 'w-11 h-11 rounded-2xl shadow-lg shadow-brand-500/30',
    icon: 'w-6 h-6',
    title: 'text-xl font-black tracking-tight',
    subtitle: 'text-xs',
    gap: 'gap-3',
    badge: 'text-[10px] px-2 py-0.5',
  },
};

export const Logo: React.FC<LogoProps> = ({
  to,
  variant = 'dark',
  size = 'md',
  subtitle = 'Self-Storage Solutions',
  showSubtitle = true,
  badge,
  iconOnly = false,
  className = '',
  onClick,
}) => {
  const conf = sizeConfig[size];

  const content = (
    <div
      className={`inline-flex items-center ${conf.gap} select-none group transition-all ${className}`}
      onClick={onClick}
    >
      {/* Icon biểu tượng thương hiệu thống nhất 3 khối hộp Boxes */}
      <div
        className={`${conf.box} bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105`}
      >
        <Boxes className={conf.icon} />
      </div>

      {/* Typography thương hiệu */}
      {!iconOnly && (
        <div className="leading-tight text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`${conf.title} ${
                variant === 'light' ? 'text-white' : 'text-slate-900'
              } tracking-tight block truncate`}
            >
              SmartStorage
            </span>
            {badge && (
              <span
                className={`${conf.badge} font-bold uppercase tracking-wider rounded-full border ${
                  variant === 'light'
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/30'
                    : 'bg-brand-50 text-brand-700 border-brand-200/60'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          {showSubtitle && subtitle && (
            <span
              className={`${conf.subtitle} ${
                variant === 'light' ? 'text-slate-400' : 'text-brand-600'
              } block truncate`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    );
  }

  return content;
};
