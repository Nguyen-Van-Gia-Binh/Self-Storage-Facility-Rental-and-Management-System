// frontend/src/features/manager/utils/unitTypeTheme.ts
import {
  Snowflake,
  Package,
  Box,
  Layers,
  Warehouse,
  FileText,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export interface UnitTypeTheme {
  categoryLabel: string;
  badgeText: string;
  icon: LucideIcon;
  gradientBg: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  badgeBg: string;
  badgeTextCol: string;
  badgeBorder: string;
  ringClass: string;
}

const FALLBACK_PALETTES = [
  {
    categoryLabel: 'Kho Tiêu Chuẩn',
    gradientBg: 'from-sky-500/10 via-sky-500/5 to-transparent',
    iconBg: 'bg-sky-50 border-sky-200',
    iconColor: 'text-sky-600',
    borderAccent: 'hover:border-sky-400 hover:shadow-sky-500/10',
    badgeBg: 'bg-sky-50',
    badgeTextCol: 'text-sky-700',
    badgeBorder: 'border-sky-200',
    ringClass: 'group-hover:ring-sky-500/20',
  },
  {
    categoryLabel: 'Kho Đa Năng',
    gradientBg: 'from-violet-500/10 via-violet-500/5 to-transparent',
    iconBg: 'bg-violet-50 border-violet-200',
    iconColor: 'text-violet-600',
    borderAccent: 'hover:border-violet-400 hover:shadow-violet-500/10',
    badgeBg: 'bg-violet-50',
    badgeTextCol: 'text-violet-700',
    badgeBorder: 'border-violet-200',
    ringClass: 'group-hover:ring-violet-500/20',
  },
  {
    categoryLabel: 'Kho Gia Dụng',
    gradientBg: 'from-teal-500/10 via-teal-500/5 to-transparent',
    iconBg: 'bg-teal-50 border-teal-200',
    iconColor: 'text-teal-600',
    borderAccent: 'hover:border-teal-400 hover:shadow-teal-500/10',
    badgeBg: 'bg-teal-50',
    badgeTextCol: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    ringClass: 'group-hover:ring-teal-500/20',
  },
  {
    categoryLabel: 'Kho Kinh Doanh',
    gradientBg: 'from-amber-500/10 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    borderAccent: 'hover:border-amber-400 hover:shadow-amber-500/10',
    badgeBg: 'bg-amber-50',
    badgeTextCol: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    ringClass: 'group-hover:ring-amber-500/20',
  },
  {
    categoryLabel: 'Kho Đặc Thù',
    gradientBg: 'from-rose-500/10 via-rose-500/5 to-transparent',
    iconBg: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
    borderAccent: 'hover:border-rose-400 hover:shadow-rose-500/10',
    badgeBg: 'bg-rose-50',
    badgeTextCol: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    ringClass: 'group-hover:ring-rose-500/20',
  },
  {
    categoryLabel: 'Kho Thể Tích Lớn',
    gradientBg: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    borderAccent: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
    badgeBg: 'bg-emerald-50',
    badgeTextCol: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    ringClass: 'group-hover:ring-emerald-500/20',
  },
];

/**
 * Xác định bộ Theme hình ảnh động & phong cách màu cho loại ô kho:
 * 1. Nhận diện ngữ nghĩa (Keywords: lạnh, tài liệu, xe...)
 * 2. Phân loại theo diện tích quy chuẩn (areaM2)
 * 3. Fallback theo chu kỳ bảng màu (Palette loop) theo ID
 */
export function getUnitTypeTheme(type: {
  id?: number;
  code?: string;
  name: string;
  areaM2?: number;
  widthM?: number;
  depthM?: number;
}): UnitTypeTheme {
  const code = (type.code || '').toUpperCase();
  const name = (type.name || '').toLowerCase();
  const area = type.areaM2 || (type.widthM && type.depthM ? type.widthM * type.depthM : 0);

  // 1. Kiểm tra từ khóa đặc thù (Semantic Keyword Matches)
  if (
    code.includes('CLIMATE') ||
    name.includes('lạnh') ||
    name.includes('máy lạnh') ||
    name.includes('điều hòa')
  ) {
    return {
      categoryLabel: 'Kho Máy Lạnh',
      badgeText: 'Nhiệt độ ổn định 20–25°C',
      icon: Snowflake,
      gradientBg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
      iconBg: 'bg-cyan-50 border-cyan-200/80',
      iconColor: 'text-cyan-600',
      borderAccent: 'hover:border-cyan-400 hover:shadow-cyan-500/10',
      badgeBg: 'bg-cyan-50',
      badgeTextCol: 'text-cyan-700',
      badgeBorder: 'border-cyan-200',
      ringClass: 'group-hover:ring-cyan-500/20',
    };
  }

  if (
    name.includes('tài liệu') ||
    name.includes('hồ sơ') ||
    name.includes('văn phòng') ||
    code.includes('DOC')
  ) {
    return {
      categoryLabel: 'Kho Tài Liệu',
      badgeText: 'Hồ sơ văn phòng · Chống ẩm',
      icon: FileText,
      gradientBg: 'from-blue-500/15 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-50 border-blue-200/80',
      iconColor: 'text-blue-600',
      borderAccent: 'hover:border-blue-400 hover:shadow-blue-500/10',
      badgeBg: 'bg-blue-50',
      badgeTextCol: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      ringClass: 'group-hover:ring-blue-500/20',
    };
  }

  if (
    name.includes('xe') ||
    name.includes('phương tiện') ||
    name.includes('oto') ||
    code.includes('VEHICLE')
  ) {
    return {
      categoryLabel: 'Kho Phương Tiện',
      badgeText: 'Lưu giữ xe · Cửa ra vào lớn',
      icon: Truck,
      gradientBg: 'from-rose-500/15 via-rose-500/5 to-transparent',
      iconBg: 'bg-rose-50 border-rose-200/80',
      iconColor: 'text-rose-600',
      borderAccent: 'hover:border-rose-400 hover:shadow-rose-500/10',
      badgeBg: 'bg-rose-50',
      badgeTextCol: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      ringClass: 'group-hover:ring-rose-500/20',
    };
  }

  // 2. Phân loại theo Diện tích quy chuẩn (areaM2)
  if (area > 0 && area < 2) {
    // Siêu nhỏ / Locker (< 2m²)
    return {
      categoryLabel: 'Kho Nhỏ',
      badgeText: `Tối ưu cá nhân · ${area} m²`,
      icon: Box,
      gradientBg: 'from-violet-500/15 via-violet-500/5 to-transparent',
      iconBg: 'bg-violet-50 border-violet-200/80',
      iconColor: 'text-violet-600',
      borderAccent: 'hover:border-violet-400 hover:shadow-violet-500/10',
      badgeBg: 'bg-violet-50',
      badgeTextCol: 'text-violet-700',
      badgeBorder: 'border-violet-200',
      ringClass: 'group-hover:ring-violet-500/20',
    };
  }

  if (area >= 2 && area < 6) {
    // Vừa / Gia đình (2m² - <6m²)
    return {
      categoryLabel: 'Kho Vừa (Gia Đình)',
      badgeText: `Đồ dùng sinh hoạt · ${area} m²`,
      icon: Package,
      gradientBg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      iconColor: 'text-emerald-600',
      borderAccent: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
      badgeBg: 'bg-emerald-50',
      badgeTextCol: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      ringClass: 'group-hover:ring-emerald-500/20',
    };
  }

  if (area >= 6 && area < 15) {
    // Lớn / Kinh doanh (6m² - <15m²)
    return {
      categoryLabel: 'Kho Lớn (Kinh Doanh)',
      badgeText: `Hàng thương mại · ${area} m²`,
      icon: Layers,
      gradientBg: 'from-amber-500/15 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-50 border-amber-200/80',
      iconColor: 'text-amber-600',
      borderAccent: 'hover:border-amber-400 hover:shadow-amber-500/10',
      badgeBg: 'bg-amber-50',
      badgeTextCol: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      ringClass: 'group-hover:ring-amber-500/20',
    };
  }

  if (area >= 15) {
    // Siêu lớn / Nhà xưởng (>= 15m²)
    return {
      categoryLabel: 'Kho Siêu Lớn',
      badgeText: `Quy mô nhà xưởng · ${area} m²`,
      icon: Warehouse,
      gradientBg: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
      iconBg: 'bg-indigo-50 border-indigo-200/80',
      iconColor: 'text-indigo-600',
      borderAccent: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
      badgeBg: 'bg-indigo-50',
      badgeTextCol: 'text-indigo-700',
      badgeBorder: 'border-indigo-200',
      ringClass: 'group-hover:ring-indigo-500/20',
    };
  }

  // 3. Fallback theo chu kỳ bảng màu (Palette Loop by ID or name hash)
  const idHash = Math.abs(type.id || (type.code ? type.code.charCodeAt(0) : 0));
  const palette = FALLBACK_PALETTES[idHash % FALLBACK_PALETTES.length];

  return {
    badgeText: area > 0 ? `Quy chuẩn ${area} m²` : 'Tiêu chuẩn',
    icon: Package,
    ...palette,
  };
}
