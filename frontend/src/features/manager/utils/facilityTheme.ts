// frontend/src/features/manager/utils/facilityTheme.ts
export interface FacilityTheme {
  regionLabel: string;
  gradientBg: string;
  iconBg: string;
  iconColor: string;
  borderAccent: string;
  badgeBg: string;
  badgeTextCol: string;
  badgeBorder: string;
  glowClass: string;
}

const GLOBAL_FALLBACK_PALETTES = [
  {
    gradientBg: 'from-teal-500/15 via-teal-500/5 to-transparent',
    iconBg: 'bg-teal-50 border-teal-200/80',
    iconColor: 'text-teal-600',
    borderAccent: 'hover:border-teal-400 hover:shadow-teal-500/10',
    badgeBg: 'bg-teal-50',
    badgeTextCol: 'text-teal-700',
    badgeBorder: 'border-teal-200',
    glowClass: 'group-hover:ring-teal-500/20',
  },
  {
    gradientBg: 'from-blue-500/15 via-blue-500/5 to-transparent',
    iconBg: 'bg-blue-50 border-blue-200/80',
    iconColor: 'text-blue-600',
    borderAccent: 'hover:border-blue-400 hover:shadow-blue-500/10',
    badgeBg: 'bg-blue-50',
    badgeTextCol: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    glowClass: 'group-hover:ring-blue-500/20',
  },
  {
    gradientBg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconBg: 'bg-amber-50 border-amber-200/80',
    iconColor: 'text-amber-600',
    borderAccent: 'hover:border-amber-400 hover:shadow-amber-500/10',
    badgeBg: 'bg-amber-50',
    badgeTextCol: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    glowClass: 'group-hover:ring-amber-500/20',
  },
  {
    gradientBg: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
    iconBg: 'bg-indigo-50 border-indigo-200/80',
    iconColor: 'text-indigo-600',
    borderAccent: 'hover:border-indigo-400 hover:shadow-indigo-500/10',
    badgeBg: 'bg-indigo-50',
    badgeTextCol: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    glowClass: 'group-hover:ring-indigo-500/20',
  },
  {
    gradientBg: 'from-rose-500/15 via-rose-500/5 to-transparent',
    iconBg: 'bg-rose-50 border-rose-200/80',
    iconColor: 'text-rose-600',
    borderAccent: 'hover:border-rose-400 hover:shadow-rose-500/10',
    badgeBg: 'bg-rose-50',
    badgeTextCol: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    glowClass: 'group-hover:ring-rose-500/20',
  },
  {
    gradientBg: 'from-violet-500/15 via-violet-500/5 to-transparent',
    iconBg: 'bg-violet-50 border-violet-200/80',
    iconColor: 'text-violet-600',
    borderAccent: 'hover:border-violet-400 hover:shadow-violet-500/10',
    badgeBg: 'bg-violet-50',
    badgeTextCol: 'text-violet-700',
    badgeBorder: 'border-violet-200',
    glowClass: 'group-hover:ring-violet-500/20',
  },
];

/**
 * Trích xuất tên Tỉnh/Thành phố thông minh từ địa chỉ hoặc tên cơ sở
 */
export function extractProvinceName(address?: string, name?: string): string {
  const text = `${address || ''} ${name || ''}`.toLowerCase();

  // Danh sách các tỉnh thành phố phổ biến ở Việt Nam
  const provinces = [
    { key: 'hà nội', label: 'Hà Nội' },
    { key: 'ha noi', label: 'Hà Nội' },
    { key: 'cầu giấy', label: 'Hà Nội' },
    { key: 'hồ chí minh', label: 'TP.HCM' },
    { key: 'tp.hcm', label: 'TP.HCM' },
    { key: 'tphcm', label: 'TP.HCM' },
    { key: 'sài gòn', label: 'TP.HCM' },
    { key: 'đà nẵng', label: 'Đà Nẵng' },
    { key: 'da nang', label: 'Đà Nẵng' },
    { key: 'hải phòng', label: 'Hải Phòng' },
    { key: 'quảng ninh', label: 'Quảng Ninh' },
    { key: 'bình dương', label: 'Bình Dương' },
    { key: 'đồng nai', label: 'Đồng Nai' },
    { key: 'cần thơ', label: 'Cần Thơ' },
    { key: 'bà rịa', label: 'Vũng Tàu' },
    { key: 'vũng tàu', label: 'Vũng Tàu' },
    { key: 'khánh hòa', label: 'Nha Trang' },
    { key: 'nha trang', label: 'Nha Trang' },
    { key: 'thừa thiên huế', label: 'Huế' },
    { key: 'huế', label: 'Huế' },
    { key: 'lâm đồng', label: 'Đà Lạt' },
    { key: 'đà lạt', label: 'Đà Lạt' },
    { key: 'đắk lắk', label: 'Buôn Ma Thuột' },
    { key: 'long an', label: 'Long An' },
    { key: 'tiền giang', label: 'Tiền Giang' },
    { key: 'bắc ninh', label: 'Bắc Ninh' },
    { key: 'hưng yên', label: 'Hưng Yên' },
    { key: 'hải dương', label: 'Hải Dương' },
    { key: 'thái nguyên', label: 'Thái Nguyên' },
    { key: 'thanh hóa', label: 'Thanh Hóa' },
    { key: 'nghệ an', label: 'Nghệ An' },
    { key: 'quảng nam', label: 'Quảng Nam' },
    { key: 'bình định', label: 'Quy Nhơn' },
  ];

  for (const p of provinces) {
    if (text.includes(p.key)) {
      return p.label;
    }
  }

  // Fallback: nếu chuỗi địa chỉ có dấu phẩy, lấy phần tử cuối cùng (thường là Tỉnh/Thành)
  if (address && address.includes(',')) {
    const parts = address.split(',').map((s) => s.trim());
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length < 30) {
      return lastPart.replace(/^(tỉnh|thành phố|tp\.)\s*/i, '');
    }
  }

  return 'Điểm cơ sở';
}

/**
 * Thuật toán băm chuỗi sang số nguyên cố định (Deterministic Hash Code)
 */
function stringHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Xác định bộ Theme hình ảnh động & phong cách màu cho Cơ sở:
 * Tầng 1: Phân loại theo 4 Đại Vùng Địa Lý Việt Nam (Bắc, Trung, Phương Nam, Tây Nguyên)
 * Tầng 2: Fallback Hash chuỗi đảm bảo cơ sở ở bất kỳ tỉnh nào cũng luôn có màu sang trọng
 */
export function getFacilityTheme(facility: {
  id?: number;
  code?: string;
  name: string;
  address?: string;
}): FacilityTheme {
  const text = `${facility.address || ''} ${facility.name} ${facility.code || ''}`.toLowerCase();
  const province = extractProvinceName(facility.address, facility.name);

  // 1. MIỀN BẮC & ĐỒNG BẰNG SÔNG HỒNG (Emerald / Teal)
  if (
    text.includes('hà nội') ||
    text.includes('ha noi') ||
    text.includes('cầu giấy') ||
    text.includes('hải phòng') ||
    text.includes('quảng ninh') ||
    text.includes('bắc ninh') ||
    text.includes('hưng yên') ||
    text.includes('hải dương') ||
    text.includes('thái nguyên') ||
    text.includes('nam định') ||
    text.includes('ninh bình') ||
    text.includes('hà nam') ||
    text.includes('vĩnh phúc') ||
    text.includes('phú thọ')
  ) {
    const isHanoi = text.includes('hà nội') || text.includes('cầu giấy');
    return {
      regionLabel: isHanoi ? 'Khu vực Thủ đô' : `Miền Bắc · ${province}`,
      gradientBg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-50 border-emerald-200/80',
      iconColor: 'text-emerald-600',
      borderAccent: 'hover:border-emerald-400 hover:shadow-emerald-500/10',
      badgeBg: 'bg-emerald-50',
      badgeTextCol: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      glowClass: 'group-hover:ring-emerald-500/20',
    };
  }

  // 2. MIỀN TRUNG & DUYÊN HẢI (Cyan / Ocean Blue)
  if (
    text.includes('đà nẵng') ||
    text.includes('da nang') ||
    text.includes('huế') ||
    text.includes('quảng nam') ||
    text.includes('quảng ngãi') ||
    text.includes('bình định') ||
    text.includes('quy nhơn') ||
    text.includes('khánh hòa') ||
    text.includes('nha trang') ||
    text.includes('phú yên') ||
    text.includes('ninh thuận') ||
    text.includes('bình thuận') ||
    text.includes('thanh hóa') ||
    text.includes('nghệ an') ||
    text.includes('hà tĩnh')
  ) {
    const isDaNang = text.includes('đà nẵng') || text.includes('da nang');
    return {
      regionLabel: isDaNang ? 'Miền Trung · Đà Nẵng' : `Duyên hải · ${province}`,
      gradientBg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
      iconBg: 'bg-cyan-50 border-cyan-200/80',
      iconColor: 'text-cyan-600',
      borderAccent: 'hover:border-cyan-400 hover:shadow-cyan-500/10',
      badgeBg: 'bg-cyan-50',
      badgeTextCol: 'text-cyan-700',
      badgeBorder: 'border-cyan-200',
      glowClass: 'group-hover:ring-cyan-500/20',
    };
  }

  // 3. TÂY NGUYÊN (Warm Amber / Orange)
  if (
    text.includes('lâm đồng') ||
    text.includes('đà lạt') ||
    text.includes('đắk lắk') ||
    text.includes('buôn ma thuột') ||
    text.includes('gia lai') ||
    text.includes('pleiku') ||
    text.includes('kon tum') ||
    text.includes('đắk nông')
  ) {
    return {
      regionLabel: `Tây Nguyên · ${province}`,
      gradientBg: 'from-amber-500/15 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-50 border-amber-200/80',
      iconColor: 'text-amber-600',
      borderAccent: 'hover:border-amber-400 hover:shadow-amber-500/10',
      badgeBg: 'bg-amber-50',
      badgeTextCol: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      glowClass: 'group-hover:ring-amber-500/20',
    };
  }

  // 4. ĐÔNG NAM BỘ & ĐBSCL / PHƯƠNG NAM (Royal Blue / Cobalt)
  if (
    text.includes('hồ chí minh') ||
    text.includes('tp.hcm') ||
    text.includes('tphcm') ||
    text.includes('sài gòn') ||
    text.includes('bình dương') ||
    text.includes('đồng nai') ||
    text.includes('biên hòa') ||
    text.includes('bà rịa') ||
    text.includes('vũng tàu') ||
    text.includes('cần thơ') ||
    text.includes('long an') ||
    text.includes('tiền giang') ||
    text.includes('bến tre') ||
    text.includes('đồng tháp') ||
    text.includes('an giang') ||
    text.includes('kiên giang') ||
    text.includes('phú quốc')
  ) {
    const isHcm = text.includes('hồ chí minh') || text.includes('tp.hcm') || text.includes('sài gòn');
    return {
      regionLabel: isHcm ? 'Đô thị TP.HCM' : `Phương Nam · ${province}`,
      gradientBg: 'from-blue-500/15 via-blue-500/5 to-transparent',
      iconBg: 'bg-blue-50 border-blue-200/80',
      iconColor: 'text-blue-600',
      borderAccent: 'hover:border-blue-400 hover:shadow-blue-500/10',
      badgeBg: 'bg-blue-50',
      badgeTextCol: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      glowClass: 'group-hover:ring-blue-500/20',
    };
  }

  // 5. TẦNG BẢO HIỂM: BĂM ĐỊNH DANH CỐ ĐỊNH (Deterministic Hash Palette)
  // Dành cho các tỉnh/thành phố đặc thù hoặc hải đảo bất kỳ
  const seed = `${facility.code || ''}-${facility.name}-${facility.id || 0}`;
  const paletteIndex = stringHashCode(seed) % GLOBAL_FALLBACK_PALETTES.length;
  const palette = GLOBAL_FALLBACK_PALETTES[paletteIndex];

  return {
    regionLabel: `📍 ${province}`,
    ...palette,
  };
}
