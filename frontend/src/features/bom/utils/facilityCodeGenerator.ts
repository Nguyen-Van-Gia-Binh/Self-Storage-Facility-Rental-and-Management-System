/**
 * Helper sinh mã cơ sở tự động dựa trên Tên cơ sở và Địa chỉ chi tiết (BOM Facility Management)
 * Quy chuẩn mã: FAC-[A-Z][A-Z0-9]{1,3} (độ dài 6–8 ký tự, ví dụ: FAC-Q1, FAC-CG, FAC-HBT, FAC-CG2)
 */

export interface GeneratedFacilityCode {
  code: string;
  suffix: string;
  reason: string;
}

/**
 * Xóa dấu tiếng Việt, giữ nguyên chữ cái latin
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Bảng từ điển các Quận/Huyện/Thành phố phổ biến tại Việt Nam
 */
interface DistrictRule {
  keywords: string[];
  suffix: string;
  label: string;
}

const KNOWN_DISTRICTS: DistrictRule[] = [
  // Hà Nội
  { keywords: ['cau giay'], suffix: 'CG', label: 'Cầu Giấy' },
  { keywords: ['hai ba trung'], suffix: 'HBT', label: 'Hai Bà Trưng' },
  { keywords: ['thanh xuan'], suffix: 'TX', label: 'Thanh Xuân' },
  { keywords: ['hoan kiem'], suffix: 'HK', label: 'Hoàn Kiếm' },
  { keywords: ['ba dinh'], suffix: 'BD', label: 'Ba Đình' },
  { keywords: ['dong da'], suffix: 'DD', label: 'Đống Đa' },
  { keywords: ['tay ho'], suffix: 'TH', label: 'Tây Hồ' },
  { keywords: ['long bien'], suffix: 'LB', label: 'Long Biên' },
  { keywords: ['hoang mai'], suffix: 'HM', label: 'Hoàng Mai' },
  { keywords: ['nam tu liem'], suffix: 'NTL', label: 'Nam Từ Liêm' },
  { keywords: ['bac tu liem'], suffix: 'BTL', label: 'Bắc Từ Liêm' },
  { keywords: ['ha dong'], suffix: 'HD', label: 'Hà Đông' },
  { keywords: ['son tay'], suffix: 'ST', label: 'Sơn Tây' },
  { keywords: ['gia lam'], suffix: 'GL', label: 'Gia Lâm' },
  { keywords: ['dong anh'], suffix: 'DA', label: 'Đông Anh' },
  { keywords: ['soc son'], suffix: 'SS', label: 'Sóc Sơn' },
  { keywords: ['thanh tri'], suffix: 'TT', label: 'Thanh Trì' },
  { keywords: ['thuong tin'], suffix: 'TT', label: 'Thường Tín' },
  { keywords: ['hoai duc'], suffix: 'HD', label: 'Hoài Đức' },
  { keywords: ['me linh'], suffix: 'ML', label: 'Mê Linh' },
  { keywords: ['dan phuong'], suffix: 'DP', label: 'Đan Phượng' },

  // TP. Hồ Chí Minh
  { keywords: ['binh thanh'], suffix: 'BT', label: 'Bình Thạnh' },
  { keywords: ['tan binh'], suffix: 'TB', label: 'Tân Bình' },
  { keywords: ['tan phu'], suffix: 'TP', label: 'Tân Phú' },
  { keywords: ['phu nhuan'], suffix: 'PN', label: 'Phú Nhuận' },
  { keywords: ['go vap'], suffix: 'GV', label: 'Gò Vấp' },
  { keywords: ['binh tan'], suffix: 'BTN', label: 'Bình Tân' },
  { keywords: ['thu duc'], suffix: 'TD', label: 'Thủ Đức' },
  { keywords: ['cu chi'], suffix: 'CC', label: 'Củ Chi' },
  { keywords: ['hoc mon'], suffix: 'HM', label: 'Hóc Môn' },
  { keywords: ['binh chanh'], suffix: 'BC', label: 'Bình Chánh' },
  { keywords: ['nha be'], suffix: 'NB', label: 'Nhà Bè' },
  { keywords: ['can gio'], suffix: 'CG', label: 'Cần Giờ' },

  // Đà Nẵng & khác
  { keywords: ['hai chau', 'ha cau'], suffix: 'HC', label: 'Hải Châu / Hà Cầu' },
  { keywords: ['thanh khe'], suffix: 'TK', label: 'Thanh Khê' },
  { keywords: ['son tra'], suffix: 'ST', label: 'Sơn Trà' },
  { keywords: ['ngu hanh son'], suffix: 'NHS', label: 'Ngũ Hành Sơn' },
  { keywords: ['lien chieu'], suffix: 'LC', label: 'Liên Chiểu' },
  { keywords: ['cam le'], suffix: 'CL', label: 'Cẩm Lệ' },
  { keywords: ['vung tau'], suffix: 'VT', label: 'Vũng Tàu' },
  { keywords: ['bien hoa'], suffix: 'BH', label: 'Biên Hòa' },
  { keywords: ['nha trang'], suffix: 'NT', label: 'Nha Trang' },
  { keywords: ['can tho'], suffix: 'CT', label: 'Cần Thơ' },
  { keywords: ['hai phong'], suffix: 'HP', label: 'Hải Phòng' },
];

/**
 * Trích xuất suffix từ quận số hoặc từ điển quận huyện
 */
function extractFromText(text: string): { suffix: string; label: string } | null {
  if (!text) return null;
  const rawClean = removeVietnameseTones(text.toLowerCase());

  // 1. Kiểm tra quận số: "quan 1", "q.1", "q 1", "q1", "quan 12"...
  const numericMatch = rawClean.match(/\b(?:quan|q\.?)\s*([1-9]|1[0-2])\b/i);
  if (numericMatch) {
    const num = numericMatch[1];
    return {
      suffix: `Q${num}`,
      label: `Quận ${num}`,
    };
  }

  // 2. Kiểm tra từ điển quận huyện chữ (so khớp ưu tiên cụm từ dài trước)
  for (const item of KNOWN_DISTRICTS) {
    for (const kw of item.keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(rawClean)) {
        return {
          suffix: item.suffix,
          label: item.label,
        };
      }
    }
  }

  // 3. Kiểm tra cụm từ hành chính tổng quát: "quan [ten]", "huyen [ten]", "tp [ten]"
  const adminMatch = rawClean.match(/\b(?:quan|huyen|thi xa|tp\.?|thanh pho)\s+([a-z\s]+?)(?:,|$|\s*-\s*|\s*\/\s*)/i);
  if (adminMatch && adminMatch[1]) {
    const words = adminMatch[1].trim().split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      // Lấy chữ cái đầu của các từ
      const initials = words.map((w) => w[0]?.toUpperCase()).join('').slice(0, 3);
      if (initials.length >= 2) {
        return {
          suffix: initials,
          label: words.join(' '),
        };
      }
    }
  }

  return null;
}

/**
 * Fallback: Trích xuất chữ cái đầu từ Tên cơ sở (bỏ từ phụ như "Kho", "Cơ sở", "SmartStorage"...)
 */
function extractFromNameFallback(name: string): { suffix: string; label: string } | null {
  if (!name || !name.trim()) return null;
  const rawClean = removeVietnameseTones(name.trim().toLowerCase());

  // Lọc bỏ stop words
  const stopWords = [
    'kho',
    'co so',
    'chi nhanh',
    'smartstorage',
    'smart storage',
    'storage',
    'facility',
    'he thong',
    'trung tam',
    'viet nam',
  ];

  let cleaned = rawClean;
  for (const sw of stopWords) {
    cleaned = cleaned.replace(new RegExp(`\\b${sw}\\b`, 'gi'), ' ');
  }

  // Tách các từ còn lại
  const words = cleaned
    .replace(/[^a-z0-9\s]/gi, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) return null;

  if (words.length === 1) {
    // 1 từ: lấy 2-3 ký tự đầu
    const word = words[0].toUpperCase();
    const sub = word.slice(0, Math.min(3, Math.max(2, word.length)));
    return { suffix: sub, label: `tên cơ sở "${words[0]}"` };
  }

  // Nhiều từ: lấy chữ cái đầu các từ (2-3 ký tự)
  const initials = words.map((w) => w[0].toUpperCase()).join('').slice(0, 3);
  if (initials.length >= 2) {
    return { suffix: initials, label: `tên cơ sở "${words.join(' ')}"` };
  }

  return null;
}

/**
 * Hàm sinh mã cơ sở chính (Main Generator)
 *
 * @param name Tên cơ sở
 * @param address Địa chỉ chi tiết
 * @param existingCodes Danh sách các mã cơ sở đã có trong CSDL (để chống trùng)
 */
export function generateFacilityCode(
  name: string,
  address: string,
  existingCodes: string[] = []
): GeneratedFacilityCode | null {
  const normExisting = new Set((existingCodes || []).map((c) => (c || '').trim().toUpperCase()));

  // Ưu tiên 1: Trích xuất từ Địa chỉ chi tiết
  let extracted = extractFromText(address);

  // Ưu tiên 2: Nếu địa chỉ chưa tìm được, trích xuất từ Tên cơ sở
  if (!extracted) {
    extracted = extractFromText(name);
  }

  // Ưu tiên 3: Fallback chữ cái đầu theo Tên cơ sở
  if (!extracted) {
    extracted = extractFromNameFallback(name);
  }

  if (!extracted || !extracted.suffix) {
    return null;
  }

  let baseSuffix = extracted.suffix.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Đảm bảo bắt đầu bằng chữ cái [A-Z] và có ít nhất 2 ký tự
  if (!/^[A-Z]/.test(baseSuffix)) {
    baseSuffix = `F${baseSuffix}`;
  }
  if (baseSuffix.length < 2) {
    baseSuffix = `${baseSuffix}X`;
  }
  // Giới hạn suffix tối đa 4 ký tự (chuẩn regex FAC-[A-Z][A-Z0-9]{1,3})
  baseSuffix = baseSuffix.slice(0, 4);

  // Xử lý chống trùng lặp (Collision avoidance)
  let candidate = `FAC-${baseSuffix}`;
  let collisionIndex = 1;

  if (normExisting.has(candidate)) {
    // Nếu bị trùng mã gốc (ví dụ FAC-CG đã có)
    collisionIndex = 2;
    // Nếu baseSuffix dài 4 ký tự, cắt bớt 1 ký tự để vừa số đuôi (tổng suffix tối đa 4 ký tự)
    const truncatedBase = baseSuffix.length >= 4 ? baseSuffix.slice(0, 3) : baseSuffix;
    candidate = `FAC-${truncatedBase}${collisionIndex}`;

    while (normExisting.has(candidate) && collisionIndex < 99) {
      collisionIndex++;
      candidate = `FAC-${truncatedBase}${collisionIndex}`;
    }
  }

  const reason =
    collisionIndex > 1
      ? `Nhận diện từ ${extracted.label} (trùng mã gốc, tự tăng số ${collisionIndex})`
      : `Tự động nhận diện từ ${extracted.label}`;

  return {
    code: candidate,
    suffix: candidate.replace('FAC-', ''),
    reason,
  };
}
