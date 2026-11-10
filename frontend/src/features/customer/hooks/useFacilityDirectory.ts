import { useState, useEffect } from 'react';
import { fetchFacilities } from '@/api/facility';

export interface DisplayFacility {
  id: number | string;
  code: string;
  name: string;
  address: string;
  district: string;
  city: string;
  startingPrice: number | null;
  openingHours: string;
  image: string;
  phone: string;
}

// Bộ ảnh cơ sở nội bộ tải tức thì, ổn định 100% khi demo
export const FACILITY_IMAGES = [
  '/assets/landing/hero-green.jpg',
  '/assets/landing/facility.jpg',
  '/assets/landing/unit-nho.png',
  '/assets/landing/unit-lon.jpg',
  '/assets/landing/use-chuyen-nha.png',
];

/**
 * Trích xuất Tỉnh/Thành phố từ địa chỉ
 */
export function parseCity(address: string): string {
  if (!address) return 'Khác';
  if (address.includes('Hà Nội')) return 'Hà Nội';
  if (address.includes('TP.HCM') || address.includes('Hồ Chí Minh') || address.includes('Sài Gòn')) return 'TP. Hồ Chí Minh';
  if (address.includes('Đà Nẵng')) return 'Đà Nẵng';
  if (address.includes('Bình Dương')) return 'Bình Dương';
  if (address.includes('Cần Thơ')) return 'Cần Thơ';
  if (address.includes('Hải Phòng')) return 'Hải Phòng';
  if (address.includes('Bắc Ninh')) return 'Bắc Ninh';
  if (address.includes('Khánh Hòa') || address.includes('Nha Trang')) return 'Khánh Hòa';
  if (address.includes('Nghệ An') || address.includes('Vinh')) return 'Nghệ An';

  // Fallback linh hoạt: Lấy cụm sau dấu phẩy cuối cùng nếu có
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1].replace(/^(Tỉnh|TP\.|Thành phố)\s+/i, '').trim();
    if (lastPart) return lastPart;
  }

  return 'Khác';
}

/**
 * Trích xuất Quận/Huyện từ địa chỉ
 */
export function parseDistrict(address: string): string {
  if (!address) return 'Khu vực trung tâm';
  const match = address.match(/(Quận\s[\wÀ-ỹ0-9]+|Huyện\s[\wÀ-ỹ0-9]+|TP\.\s[\wÀ-ỹ0-9]+|Thị xã\s[\wÀ-ỹ0-9]+|Cầu Giấy|Đống Đa|Thanh Xuân|Hai Bà Trưng|Hải Châu|Bình Thạnh|Thủ Đức|Ninh Kiều|Hải An|Yên Phong|Vĩnh Nguyên|Dĩ An)/u);
  return match ? match[0] : 'Khu vực trung tâm';
}

/**
 * Custom Hook tải và ánh xạ danh mục cơ sở kho từ Backend API
 */
export function useFacilityDirectory() {
  const [facilities, setFacilities] = useState<DisplayFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    fetchFacilities()
      .then((data) => {
        if (!ignore && data) {
          const mapped: DisplayFacility[] = data.map((f, idx) => ({
            id: f.id,
            code: f.code || `FAC-${f.id}`,
            name: f.name,
            address: f.address,
            city: parseCity(f.address),
            district: parseDistrict(f.address),
            startingPrice: f.lowestMonthlyPrice && f.lowestMonthlyPrice > 0 ? f.lowestMonthlyPrice : null,
            openingHours: f.openingHours || 'Mở cửa 24/7',
            image: FACILITY_IMAGES[idx % FACILITY_IMAGES.length],
            phone: f.phone || '',
          }));
          setFacilities(mapped);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh sách cơ sở:', err);
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { facilities, isLoading };
}
