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
  description?: string;
  activeUnitTypeCount?: number;
}

// Bộ ảnh cơ sở chất lượng cao theo chuẩn thiết kế SmartStorage Landing Page
export const FACILITY_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCsKapsB2ejrDJOO8gPa_hVSPJ97EAekXm2e0E-AWZHMITgQ4u1vZjXkIq2ZbDc_b0kVkuiECVjJ2vs8so6MSQq7T11DkcLhnnrpbEUNneFgtxU4UBZRQlCDaV_Kw1Ye642Mf9bOwIZFIQ5eyf-zaWgY7a6W0wUQUY5gnK_lQ42PB6eTjNBSgZdo_eki0q-H3TKAOiIsyFKWcYb85jwKv1l-bB3wch0adlJbfcXQWIj0mve5XGrqcAJhw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCypT2ay6BF8HQheIdaLL-wSMVPbXZz2_eXNqdg2cxZSoroN8zhUqDAuBxiWPtqZJ6m0EgsifbUdMSjHxvahHmy6Gj5_yiesuOP1_kx3MNIE1fr-5mj-ZEOw3ALtz6rS8yswCTe7mb8twqhfbHZn_EjR68ifxWffulq2HwPrL8A-ITPV5L6cyp9nNrfPh9GI4wWznDqVjEbhdmyFmid2NysPjH0JkPH-Ykc7WFFc0HBo3W10ZoA6ziDMw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCT9YIFpWBx9ddblwtI078lGPYsZP6MK810B0je43T083CeUXLXFCDaoERgRHMN251hdDd5xDusj9OZd3Ilq8FvM27eFJ5OL1w83rK2JAfbGSx6IiT_ISp6h9dp48k8UpW5uzWzGO2jFNinuyG4b26lss7EcB6E464wm_uVbHVqqa1yfotVTYWBs068hn13zuCXVeCOhMH4ZjFVUVB2voRXBoPyteD3BNBCxev1FpuB1wYi3jXrfpJoqQ',
  '/assets/landing/hero-green.jpg',
  '/assets/landing/facility.jpg',
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
            description: f.description,
            activeUnitTypeCount: f.activeUnitTypeCount || 4,
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
